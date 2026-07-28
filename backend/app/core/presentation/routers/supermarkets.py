"""
Supermarkets router
"""
from typing import Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.infrastructure.database.session import get_db
from app.core.infrastructure.database.models import SupermarketModel
from app.core.infrastructure.auth.dependencies import get_current_user
from app.core.infrastructure.database.models import UserModel

router = APIRouter(prefix="/api/v1/supermarkets", tags=["supermarkets"])


class SupermarketOut(BaseModel):
    id: str
    name: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]


class CreateSupermarketRequest(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.get("/", response_model=list[SupermarketOut])
async def list_supermarkets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SupermarketModel).order_by(SupermarketModel.name))
    return [_to_out(s) for s in result.scalars().all()]


@router.post("/", response_model=SupermarketOut, status_code=status.HTTP_201_CREATED)
async def create_supermarket(
    body: CreateSupermarketRequest,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    supermarket = SupermarketModel(**body.model_dump())
    db.add(supermarket)
    await db.commit()
    await db.refresh(supermarket)
    return _to_out(supermarket)


def _to_out(s: SupermarketModel) -> SupermarketOut:
    return SupermarketOut(
        id=str(s.id),
        name=s.name,
        address=s.address,
        latitude=s.latitude,
        longitude=s.longitude,
    )
