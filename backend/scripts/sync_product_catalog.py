"""Importa produtos por categoria para o catálogo próprio do TaQuanto.

Run from backend/: python -m scripts.sync_product_catalog
Configure PRODUCT_CATALOG_CATEGORIES to control the categories and
PRODUCT_CATALOG_PAGES_PER_RUN to cap the daily import volume.
"""
import asyncio
import logging
import os
from datetime import datetime

import httpx
from sqlalchemy import select

from app.core.infrastructure.database.models import ProductCatalogSyncState, ProductModel
from app.core.infrastructure.database.session import AsyncSessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("taquanto.catalog_import")

OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search"
DEFAULT_CATEGORIES = [
    "en:beverages",
    "en:dairy-products",
    "en:snacks",
    "en:breakfast-cereals",
    "en:plant-based-foods",
]
PAGE_SIZE = 50
REQUEST_INTERVAL_SECONDS = float(os.getenv("PRODUCT_CATALOG_REQUEST_INTERVAL_SECONDS", "6"))
PAGES_PER_CATEGORY = max(1, int(os.getenv("PRODUCT_CATALOG_PAGES_PER_RUN", "1")))


async def import_category(client: httpx.AsyncClient, category: str) -> int:
    imported = 0
    async with AsyncSessionLocal() as db:
        state_result = await db.execute(
            select(ProductCatalogSyncState).where(ProductCatalogSyncState.category == category)
        )
        state = state_result.scalar_one_or_none()
        if state is None:
            state = ProductCatalogSyncState(category=category, next_page=1)
            db.add(state)
            await db.flush()

        page = state.next_page or 1
        for _ in range(PAGES_PER_CATEGORY):
            response = await client.get(
                OFF_SEARCH_URL,
                params={
                    "categories_tags": category,
                    "page": page,
                    "page_size": PAGE_SIZE,
                    "fields": "code,product_name,product_name_pt,brands,image_front_small_url,image_url,categories_tags",
                    "sort_by": "unique_scans_n",
                },
            )
            response.raise_for_status()
            payload = response.json()
            products = payload.get("products") or []
            for item in products:
                barcode = str(item.get("code") or "").strip()
                name = (item.get("product_name_pt") or item.get("product_name") or "").strip()
                if not barcode.isdigit() or not name:
                    continue

                row_result = await db.execute(select(ProductModel).where(ProductModel.barcode == barcode))
                row = row_result.scalar_one_or_none()
                categories = item.get("categories_tags") or [category]
                encoded_categories = "|" + "|".join(categories) + "|"
                if row is None:
                    db.add(ProductModel(
                        barcode=barcode, name=name, brand=item.get("brands"),
                        image_url=item.get("image_front_small_url") or item.get("image_url"),
                        categories=encoded_categories, source="openfoodfacts",
                        source_license="ODbL/DbCL; images CC BY-SA",
                    ))
                else:
                    # Keep the community name; fill missing metadata from OFF.
                    if not row.name:
                        row.name = name
                    row.brand = row.brand or item.get("brands")
                    row.image_url = row.image_url or item.get("image_front_small_url") or item.get("image_url")
                    if row.categories == "||":
                        row.categories = encoded_categories
                    if row.source == "community":
                        row.source_license = row.source_license or "ODbL/DbCL; images CC BY-SA"
                    row.updated_at = datetime.utcnow()
                imported += 1

            state.last_synced_at = datetime.utcnow()
            state.next_page = page + 1 if len(products) >= PAGE_SIZE else 1
            await db.commit()
            logger.info("category=%s page=%s fetched=%s imported=%s", category, page, len(products), imported)
            if len(products) < PAGE_SIZE:
                break
            page += 1
            await asyncio.sleep(REQUEST_INTERVAL_SECONDS)
    return imported


async def main() -> None:
    raw_categories = os.getenv("PRODUCT_CATALOG_CATEGORIES", ",".join(DEFAULT_CATEGORIES))
    categories = [value.strip() for value in raw_categories.split(",") if value.strip()]
    contact = os.getenv("TAQUANTO_CONTACT_URL", "https://github.com/cleiltonrodriguesofc/ta-quanto-project")
    headers = {"User-Agent": f"TaQuanto/1.0 ({contact})"}
    total = 0
    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        for index, category in enumerate(categories):
            total += await import_category(client, category)
            if index < len(categories) - 1:
                await asyncio.sleep(REQUEST_INTERVAL_SECONDS)
    logger.info("catalog import completed; rows processed=%s categories=%s", total, len(categories))


if __name__ == "__main__":
    asyncio.run(main())
