"""
Users router — perfil do usuário autenticado.
"""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.infrastructure.database.session import get_db
from app.core.infrastructure.database.models import UserModel
from app.core.infrastructure.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserProfileOut(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str]
    level: int
    xp: int
    contributions: int
    saved_amount: float
    streak_days: int
    badge: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(current_user: UserModel = Depends(get_current_user)):
    return _to_out(current_user)


@router.put("/me", response_model=UserProfileOut)
async def update_my_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return _to_out(current_user)


def _to_out(u: UserModel) -> UserProfileOut:
    return UserProfileOut(
        id=str(u.id),
        name=u.name,
        email=u.email,
        avatar_url=u.avatar_url,
        level=u.level,
        xp=u.xp,
        contributions=u.contributions,
        saved_amount=u.saved_amount,
        streak_days=u.streak_days,
        badge=u.badge,
    )
