from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.follow import Follow
from app.models.user import User
from app.models.notification import NotificationType
from app.schemas.user import UserPublic
from app.services.notifications import create_notification
from pydantic import BaseModel
from datetime import datetime


class FollowerOut(BaseModel):
    id: int
    follower: UserPublic
    created_at: datetime
    model_config = {"from_attributes": True}


class FollowingOut(BaseModel):
    id: int
    following: UserPublic
    created_at: datetime
    model_config = {"from_attributes": True}

router = APIRouter()


@router.post("/{user_id}", status_code=201)
async def follow_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя подписаться на себя")
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    existing = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже подписаны")

    db.add(Follow(follower_id=current_user.id, following_id=user_id))
    await db.flush()
    await create_notification(db, user_id=user_id, from_user_id=current_user.id, type=NotificationType.follow)
    await db.commit()
    return {"detail": "Подписка оформлена"}


@router.delete("/{user_id}", status_code=204)
async def unfollow_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Подписка не найдена")
    await db.delete(follow)
    await db.commit()


@router.get("/{user_id}/followers", response_model=list[FollowerOut])
async def get_followers(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Follow)
        .options(selectinload(Follow.follower))
        .where(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{user_id}/following", response_model=list[FollowingOut])
async def get_following(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Follow)
        .options(selectinload(Follow.following))
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
    )
    return result.scalars().all()
