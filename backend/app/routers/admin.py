from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.recipe import Recipe
from app.models.comment import Comment
from app.schemas.user import UserPublic, UserAdminOut

router = APIRouter()


# ── Пользователи ────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserAdminOut])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    return result.scalars().all()


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить себя")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    await db.delete(user)
    await db.commit()


@router.patch("/users/{user_id}/role", response_model=UserAdminOut)
async def set_user_role(
    user_id: int,
    role: UserRole,
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.role = role
    await db.commit()
    return user


# ── Рецепты ─────────────────────────────────────────────────────────────────

@router.delete("/recipes/{recipe_id}", status_code=204)
async def admin_delete_recipe(
    recipe_id: int,
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    await db.delete(recipe)
    await db.commit()


# ── Комментарии ──────────────────────────────────────────────────────────────

@router.delete("/comments/{comment_id}", status_code=204)
async def admin_delete_comment(
    comment_id: int,
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    await db.delete(comment)
    await db.commit()
