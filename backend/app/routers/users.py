from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.recipe import Recipe
from app.models.follow import Follow
from app.schemas.user import UserPublic, UserProfile, UserMe, UserUpdate
from app.services.images import save_image, delete_image

router = APIRouter()


async def _build_profile(db: AsyncSession, user: User, *, is_self: bool = False) -> dict:
    recipes_count = (await db.execute(select(func.count()).where(Recipe.author_id == user.id))).scalar_one()
    followers_count = (await db.execute(select(func.count()).where(Follow.following_id == user.id))).scalar_one()
    following_count = (await db.execute(select(func.count()).where(Follow.follower_id == user.id))).scalar_one()

    data = {
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "cover_url": user.cover_url,
        "bio": user.bio,
        "created_at": user.created_at,
        "recipes_count": recipes_count,
        "followers_count": followers_count,
        "following_count": following_count,
    }
    if is_self:
        data["email"] = user.email
        data["role"] = user.role
    return data


@router.get("/me", response_model=UserMe)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _build_profile(db, current_user, is_self=True)


@router.patch("/me", response_model=UserMe)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.username is not None:
        current_user.username = data.username
    if data.bio is not None:
        current_user.bio = data.bio
    await db.commit()
    return await _build_profile(db, current_user, is_self=True)


@router.post("/me/avatar", response_model=UserMe)
async def upload_avatar(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    old_url = current_user.avatar_url
    url = await save_image(file, subfolder="avatars")
    current_user.avatar_url = url
    await db.commit()
    if old_url:
        background_tasks.add_task(delete_image, old_url)
    return await _build_profile(db, current_user, is_self=True)


@router.post("/me/cover", response_model=UserMe)
async def upload_cover(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    old_url = current_user.cover_url
    url = await save_image(file, subfolder="covers")
    current_user.cover_url = url
    await db.commit()
    if old_url:
        background_tasks.add_task(delete_image, old_url)
    return await _build_profile(db, current_user, is_self=True)


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return await _build_profile(db, user)
