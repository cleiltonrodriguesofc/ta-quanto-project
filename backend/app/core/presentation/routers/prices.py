"""
Prices router — GET /api/v1/prices, POST /api/v1/prices
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.infrastructure.database.session import get_db
from app.core.infrastructure.database.models import PriceModel, UserModel
from app.core.infrastructure.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/prices", tags=["prices"])


class PriceOut(BaseModel):
    id: str
    product_name: str
    barcode: Optional[str]
    price: float
    supermarket: str
    brand: Optional[str]
    image_url: Optional[str]
    user_id: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class RegisterPriceRequest(BaseModel):
    product_name: str
    barcode: str
    price: float
    supermarket: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.get("/", response_model=list[PriceOut])
async def get_prices(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PriceModel).order_by(desc(PriceModel.created_at)).limit(limit))
    return [_to_out(p) for p in result.scalars().all()]


@router.get("/barcode/{barcode}", response_model=list[PriceOut])
async def get_prices_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PriceModel).where(PriceModel.barcode == barcode).order_by(desc(PriceModel.created_at))
    )
    return [_to_out(p) for p in result.scalars().all()]


@router.get("/user/{user_id}", response_model=list[PriceOut])
async def get_prices_by_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PriceModel).where(PriceModel.user_id == user_id).order_by(desc(PriceModel.created_at))
    )
    return [_to_out(p) for p in result.scalars().all()]


@router.post("/", response_model=PriceOut, status_code=201)
async def register_price(
    body: RegisterPriceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    price = PriceModel(
        product_name=body.product_name,
        barcode=body.barcode,
        price=body.price,
        supermarket=body.supermarket,
        brand=body.brand,
        image_url=body.image_url,
        user_id=current_user.id,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.add(price)

    # Gamification: incrementa contributions do usuário
    current_user.contributions += 1
    current_user.xp += 10

    await db.commit()
    await db.refresh(price)
    return _to_out(price)


def _to_out(p: PriceModel) -> PriceOut:
    return PriceOut(
        id=str(p.id),
        product_name=p.product_name,
        barcode=p.barcode,
        price=p.price,
        supermarket=p.supermarket,
        brand=p.brand,
        image_url=p.image_url,
        user_id=str(p.user_id) if p.user_id else None,
        created_at=p.created_at.isoformat(),
    )
