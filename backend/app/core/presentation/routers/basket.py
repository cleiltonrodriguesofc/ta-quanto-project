"""
Saved baskets router — listas de compras salvas por usuário.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.infrastructure.database.session import get_db
from app.core.infrastructure.database.models import SavedBasketModel, SavedBasketItemModel, UserModel
from app.core.infrastructure.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/saved-baskets", tags=["saved-baskets"])


class BasketItemIn(BaseModel):
    barcode: str
    product_name: str
    price: float
    quantity: int = 1
    image_url: Optional[str] = None
    brand: Optional[str] = None


class CreateBasketRequest(BaseModel):
    name: str
    supermarket: str
    total_amount: float
    items: List[BasketItemIn]


class BasketItemOut(BaseModel):
    id: str
    barcode: str
    product_name: str
    price: float
    quantity: int
    image_url: Optional[str]
    brand: Optional[str]


class BasketOut(BaseModel):
    id: str
    name: str
    supermarket: str
    total_amount: float
    created_at: str
    updated_at: str
    items_count: int


@router.get("/", response_model=list[BasketOut])
async def get_my_baskets(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    result = await db.execute(
        select(SavedBasketModel)
        .where(SavedBasketModel.user_id == current_user.id)
        .options(selectinload(SavedBasketModel.items))
    )
    return [_basket_to_out(b) for b in result.scalars().all()]


@router.post("/", response_model=BasketOut, status_code=status.HTTP_201_CREATED)
async def create_basket(
    body: CreateBasketRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    basket = SavedBasketModel(
        user_id=current_user.id,
        name=body.name,
        supermarket=body.supermarket,
        total_amount=body.total_amount,
    )
    db.add(basket)
    await db.flush()

    for item_data in body.items:
        item = SavedBasketItemModel(basket_id=basket.id, **item_data.model_dump())
        db.add(item)

    await db.commit()
    # Recarrega com os itens para o count correto
    result = await db.execute(
        select(SavedBasketModel)
        .where(SavedBasketModel.id == basket.id)
        .options(selectinload(SavedBasketModel.items))
    )
    basket = result.scalar_one()
    return _basket_to_out(basket)


@router.get("/{basket_id}/items", response_model=list[BasketItemOut])
async def get_basket_items(
    basket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    basket = await _get_own_basket(db, basket_id, current_user.id)
    return [_item_to_out(i) for i in basket.items]


@router.delete("/{basket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_basket(
    basket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    basket = await _get_own_basket(db, basket_id, current_user.id)
    await db.delete(basket)
    await db.commit()


async def _get_own_basket(db: AsyncSession, basket_id: str, user_id: str) -> SavedBasketModel:
    result = await db.execute(
        select(SavedBasketModel)
        .where(
            SavedBasketModel.id == basket_id,
            SavedBasketModel.user_id == user_id,
        )
        .options(selectinload(SavedBasketModel.items))
    )
    basket = result.scalar_one_or_none()
    if not basket:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    return basket


def _basket_to_out(b: SavedBasketModel) -> BasketOut:
    return BasketOut(
        id=str(b.id),
        name=b.name,
        supermarket=b.supermarket,
        total_amount=b.total_amount,
        created_at=b.created_at.isoformat(),
        updated_at=b.updated_at.isoformat(),
        items_count=len(b.items) if b.items else 0,
    )


def _item_to_out(i: SavedBasketItemModel) -> BasketItemOut:
    return BasketItemOut(
        id=str(i.id),
        barcode=i.barcode,
        product_name=i.product_name,
        price=i.price,
        quantity=i.quantity,
        image_url=i.image_url,
        brand=i.brand,
    )
