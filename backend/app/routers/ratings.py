from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.rating import Rating
from app.models.recipe import Recipe
from app.models.notification import NotificationType
from app.schemas.rating import RatingCreate, RatingOut
from app.services.recipes import get_recipe_rating
from app.services.notifications import create_notification

router = APIRouter()


@router.post("/{recipe_id}", response_model=RatingOut)
async def rate_recipe(
    recipe_id: int,
    data: RatingCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe_result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    existing = await db.execute(
        select(Rating).where(Rating.recipe_id == recipe_id, Rating.user_id == current_user.id)
    )
    rating = existing.scalar_one_or_none()

    if rating:
        rating.score = data.score
    else:
        rating = Rating(recipe_id=recipe_id, user_id=current_user.id, score=data.score)
        db.add(rating)
        await db.flush()
        await create_notification(db, user_id=recipe.author_id, from_user_id=current_user.id,
                                  type=NotificationType.like, recipe_id=recipe_id)

    await db.commit()
    avg, count = await get_recipe_rating(db, recipe_id)
    return {"avg": avg, "count": count}


@router.get("/{recipe_id}", response_model=RatingOut)
async def get_rating(
    recipe_id: int,
    current_user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    avg, count = await get_recipe_rating(db, recipe_id)
    user_score = None
    if current_user:
        result = await db.execute(
            select(Rating).where(Rating.recipe_id == recipe_id, Rating.user_id == current_user.id)
        )
        r = result.scalar_one_or_none()
        user_score = r.score if r else None
    return {"avg": avg, "count": count, "user_score": user_score}
