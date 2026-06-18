from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recipe import Recipe
from app.models.follow import Follow
from app.models.rating import Rating
from app.models.favorite import Favorite
from app.schemas.recipe import RecipeListResponse
from app.services.recipes import get_recipe_rating

router = APIRouter()


@router.get("", response_model=RecipeListResponse)
async def get_feed(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Лента рецептов от авторов, на которых подписан пользователь,
    плюс популярные за пределами подписок."""

    # ID авторов из подписок
    followed_ids_result = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    followed_ids = [r for (r,) in followed_ids_result.all()]

    # Рецепты из подписок
    if followed_ids:
        feed_stmt = (
            select(Recipe)
            .options(selectinload(Recipe.author), selectinload(Recipe.ratings))
            .where(Recipe.author_id.in_(followed_ids))
            .order_by(Recipe.created_at.desc())
        )
        feed_result = await db.execute(feed_stmt)
        feed_recipes = feed_result.scalars().all()
    else:
        feed_recipes = []

    # Популярные вне подписок (заполняем до size)
    excluded_author_ids = followed_ids + [current_user.id]
    remaining = max(0, size - len(feed_recipes))
    if remaining > 0:
        popular_stmt = (
            select(Recipe)
            .options(selectinload(Recipe.author), selectinload(Recipe.ratings))
            .where(Recipe.author_id.notin_(excluded_author_ids))
            .outerjoin(Rating, Rating.recipe_id == Recipe.id)
            .outerjoin(Favorite, Favorite.recipe_id == Recipe.id)
            .group_by(Recipe.id)
            .order_by(
                func.count(Rating.id).desc(),
                func.count(Favorite.id).desc(),
                Recipe.created_at.desc(),
            )
            .limit(remaining)
        )
        popular_result = await db.execute(popular_stmt)
        popular_recipes = popular_result.scalars().all()
    else:
        popular_recipes = []

    all_recipes = (feed_recipes + popular_recipes)
    # Пагинация
    total = len(all_recipes)
    paged = all_recipes[(page - 1) * size: page * size]

    items = []
    for r in paged:
        avg, count = await get_recipe_rating(db, r.id)
        items.append({
            "id": r.id, "title": r.title, "cover_url": r.cover_url,
            "cook_time": r.cook_time, "servings": r.servings,
            "cuisine": r.cuisine, "category": r.category, "difficulty": r.difficulty,
            "author": r.author, "avg_rating": avg, "ratings_count": count,
            "created_at": r.created_at,
        })
    return {"items": items, "total": total, "page": page, "size": size}
