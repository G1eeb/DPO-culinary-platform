from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comment import Comment
from app.models.recipe import Recipe
from app.models.notification import NotificationType
from app.schemas.comment import CommentCreate, CommentOut
from app.services.notifications import create_notification

router = APIRouter()


@router.get("/{recipe_id}", response_model=list[CommentOut])
async def get_comments(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user), selectinload(Comment.replies).selectinload(Comment.user))
        .where(Comment.recipe_id == recipe_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{recipe_id}", response_model=CommentOut, status_code=201)
async def add_comment(
    recipe_id: int,
    data: CommentCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe_result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    comment = Comment(
        recipe_id=recipe_id,
        user_id=current_user.id,
        text=data.text,
        parent_id=data.parent_id,
    )
    db.add(comment)
    await db.flush()

    notif_type = NotificationType.reply if data.parent_id else NotificationType.comment
    await create_notification(db, user_id=recipe.author_id, from_user_id=current_user.id,
                              type=notif_type, recipe_id=recipe_id)
    await db.commit()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user), selectinload(Comment.replies))
        .where(Comment.id == comment.id)
    )
    return result.scalar_one()


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    await db.delete(comment)
    await db.commit()
