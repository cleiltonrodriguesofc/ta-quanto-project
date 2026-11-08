"""Catálogo próprio de produtos e fallback de consulta a fontes externas."""
import logging
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.infrastructure.auth.dependencies import get_current_user
from app.core.infrastructure.database.models import PriceModel, ProductModel, UserModel
from app.core.infrastructure.database.session import get_db

logger = logging.getLogger("taquanto.products")
router = APIRouter(prefix="/api/v1/products", tags=["products"])
OFF_USER_AGENT = "TaQuanto/1.0 (https://github.com/cleiltonrodriguesofc/ta-quanto-project)"


class ProductOut(BaseModel):
    barcode: str
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    avg_price: Optional[float] = None
    supermarket: Optional[str] = None
    categories: list[str] = Field(default_factory=list)
    source: Optional[str] = None
    source_license: Optional[str] = None
    updated_at: Optional[datetime] = None


class ProductUpsert(BaseModel):
    barcode: str
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    categories: list[str] = Field(default_factory=list)


def _categories(value: str | None) -> list[str]:
    if not value:
        return []
    return [item for item in value.strip("|").split("|") if item]


def _out(product: ProductModel, avg_price: float | None = None, supermarket: str | None = None) -> ProductOut:
    return ProductOut(
        barcode=product.barcode,
        name=product.name,
        brand=product.brand,
        image_url=product.image_url,
        avg_price=avg_price,
        supermarket=supermarket,
        categories=_categories(product.categories),
        source=product.source,
        source_license=product.source_license,
        updated_at=product.updated_at,
    )


async def _save_product(
    db: AsyncSession,
    barcode: str,
    name: str,
    brand: str | None = None,
    image_url: str | None = None,
    categories: list[str] | None = None,
    source: str = "community",
    source_license: str | None = None,
) -> ProductModel:
    result = await db.execute(select(ProductModel).where(ProductModel.barcode == barcode))
    row = result.scalar_one_or_none()
    encoded_categories = "|" + "|".join(categories or []) + "|"
    if row is None:
        row = ProductModel(
            barcode=barcode, name=name.strip(), brand=brand, image_url=image_url,
            categories=encoded_categories, source=source, source_license=source_license,
        )
        db.add(row)
    else:
        if name.strip():
            row.name = name.strip()
        row.brand = brand or row.brand
        row.image_url = image_url or row.image_url
        row.categories = encoded_categories if categories else row.categories
        row.source = source if source != "community" else row.source
        row.source_license = source_license or row.source_license
        row.updated_at = datetime.utcnow()
    await db.flush()
    return row


@router.get("/catalog", response_model=list[ProductOut])
async def get_catalog(
    category: str | None = Query(None, description="Category tag, for example en:beverages"),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List cached products, preferring the items users scan most often."""
    query = select(ProductModel)
    if category:
        query = query.where(ProductModel.categories.ilike(f"%|{category}|%"))
    query = query.order_by(desc(ProductModel.lookup_count), desc(ProductModel.updated_at))
    result = await db.execute(query.offset(offset).limit(limit))
    return [_out(p) for p in result.scalars().all()]


@router.post("/", response_model=ProductOut)
async def save_product(
    body: ProductUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    del current_user
    product = await _save_product(
        db, body.barcode, body.name, body.brand, body.image_url,
        body.categories, source="community",
    )
    await db.commit()
    await db.refresh(product)
    return _out(product)


@router.get("/{barcode}", response_model=ProductOut)
async def get_product(barcode: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductModel).where(ProductModel.barcode == barcode))
    cached = result.scalar_one_or_none()
    if cached:
        cached.lookup_count += 1
        await db.commit()
        prices = await db.execute(select(PriceModel.price, PriceModel.supermarket).where(PriceModel.barcode == barcode))
        rows = prices.all()
        avg = round(sum(row[0] for row in rows) / len(rows), 2) if rows else None
        return _out(cached, avg, rows[0][1] if rows else None)

    # Community price history can seed the catalog without another public lookup.
    result = await db.execute(
        select(PriceModel).where(
            PriceModel.barcode == barcode, PriceModel.product_name != ""
        ).order_by(desc(PriceModel.created_at)).limit(1)
    )
    local = result.scalar_one_or_none()
    if local:
        prices = await db.execute(select(PriceModel.price, PriceModel.supermarket).where(PriceModel.barcode == barcode))
        rows = prices.all()
        avg = round(sum(row[0] for row in rows) / len(rows), 2) if rows else local.price
        product = await _save_product(
            db, barcode, local.product_name, local.brand, local.image_url,
            source="community",
        )
        product.lookup_count += 1
        await db.commit()
        await db.refresh(product)
        return _out(product, avg, local.supermarket)

    # External lookups are the slow path. Cache successful results for future users.
    product_data = None
    async with httpx.AsyncClient(timeout=6.0, headers={"User-Agent": OFF_USER_AGENT}) as client:
        try:
            response = await client.get(
                f"https://world.openfoodfacts.org/api/v2/product/{barcode}",
                params={"fields": "code,product_name,product_name_pt,brands,image_url,image_front_small_url,categories_tags"},
            )
            if response.status_code == 200:
                payload = response.json()
                data = payload.get("product") or {}
                name = data.get("product_name_pt") or data.get("product_name")
                if payload.get("status") == 1 and name:
                    product_data = {
                        "name": name, "brand": data.get("brands"),
                        "image_url": data.get("image_front_small_url") or data.get("image_url"),
                        "categories": data.get("categories_tags") or [],
                        "source": "openfoodfacts",
                        "license": "ODbL/DbCL; images CC BY-SA",
                    }
        except Exception as exc:
            logger.info("Open Food Facts lookup failed for %s: %s", barcode, exc)

        if product_data is None and settings.cosmos_api_token:
            try:
                response = await client.get(
                    f"{settings.cosmos_api_url}/{barcode}",
                    headers={"X-Cosmos-Token": settings.cosmos_api_token},
                )
                if response.status_code == 200:
                    data = response.json()
                    name = data.get("description")
                    if name:
                        product_data = {
                            "name": name, "brand": data.get("brand"),
                            "image_url": data.get("thumbnail"), "categories": [],
                            "source": "cosmos", "license": None,
                        }
            except Exception as exc:
                logger.info("Cosmos lookup failed for %s: %s", barcode, exc)

        if product_data is None and settings.go_upc_api_key:
            try:
                response = await client.get(
                    f"https://go-upc.com/api/v1/code/{barcode}",
                    headers={"Authorization": f"Bearer {settings.go_upc_api_key}"},
                )
                if response.status_code == 200:
                    data = response.json()
                    product = data.get("product") or {}
                    name = product.get("name")
                    if name:
                        product_data = {
                            "name": name, "brand": product.get("brand"),
                            "image_url": product.get("imageUrl"), "categories": [],
                            "source": "go-upc", "license": None,
                        }
            except Exception as exc:
                logger.info("Go-UPC lookup failed for %s: %s", barcode, exc)

    if product_data:
        product = await _save_product(
            db, barcode, product_data["name"], product_data["brand"],
            product_data["image_url"], product_data["categories"],
            product_data["source"], product_data["license"],
        )
        product.lookup_count += 1
        await db.commit()
        await db.refresh(product)
        return _out(product)

    raise HTTPException(status_code=404, detail="Produto não encontrado")
