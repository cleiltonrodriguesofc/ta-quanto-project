"""
Products router — busca produto por barcode, com fallback para APIs externas.
A lógica de lookup fica no SERVIDOR, não no app.
"""
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.infrastructure.database.session import get_db
from app.core.infrastructure.database.models import PriceModel
from app.config import settings

router = APIRouter(prefix="/api/v1/products", tags=["products"])


class ProductOut(BaseModel):
    barcode: str
    name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    avg_price: Optional[float] = None
    supermarket: Optional[str] = None


@router.get("/{barcode}", response_model=ProductOut)
async def get_product(barcode: str, db: AsyncSession = Depends(get_db)):
    # 1. Tenta no banco local (preços registrados)
    result = await db.execute(
        select(PriceModel).where(PriceModel.barcode == barcode).limit(1)
    )
    local = result.scalar_one_or_none()
    if local:
        prices_result = await db.execute(
            select(PriceModel.price).where(PriceModel.barcode == barcode)
        )
        all_prices = [r[0] for r in prices_result.all()]
        avg = sum(all_prices) / len(all_prices) if all_prices else local.price

        return ProductOut(
            barcode=barcode,
            name=local.product_name,
            brand=local.brand,
            image_url=local.image_url,
            avg_price=round(avg, 2),
            supermarket=local.supermarket,
        )

    # 2. Fallback: OpenFoodFacts
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json")
            if resp.status_code == 200:
                data = resp.json()
                product = data.get("product", {})
                if product:
                    return ProductOut(
                        barcode=barcode,
                        name=product.get("product_name") or product.get("product_name_pt") or "Produto desconhecido",
                        brand=product.get("brands"),
                        image_url=product.get("image_url"),
                    )
    except Exception:
        pass

    # 3. Fallback: Cosmos (chave de API fica no backend)
    if settings.cosmos_api_token:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{settings.cosmos_api_url}/{barcode}",
                    headers={"X-Cosmos-Token": settings.cosmos_api_token},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return ProductOut(
                        barcode=barcode,
                        name=data.get("description") or "Produto desconhecido",
                        brand=data.get("brand"),
                        image_url=data.get("thumbnail"),
                    )
        except Exception:
            pass

    raise HTTPException(status_code=404, detail="Produto não encontrado")
