from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.favorite import Favorite
from app.models.recipe import Recipe
from app.schemas.recipe import RecipeCard, RecipeListResponse
from app.services.recipes import get_recipe_rating

router = APIRouter()


@router.get("", response_model=RecipeListResponse)
async def get_favorites(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Подсчёт общего количества
    count_result = await db.execute(
        select(func.count(Favorite.id)).where(Favorite.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Recipe)
        .join(Favorite, Favorite.recipe_id == Recipe.id)
        .options(selectinload(Recipe.author), selectinload(Recipe.ratings))
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    recipes = result.scalars().all()
    items = []
    for r in recipes:
        avg, count = await get_recipe_rating(db, r.id)
        items.append({
            "id": r.id, "title": r.title, "cover_url": r.cover_url,
            "cook_time": r.cook_time, "servings": r.servings,
            "cuisine": r.cuisine, "category": r.category, "difficulty": r.difficulty,
            "author": r.author, "avg_rating": avg, "ratings_count": count,
            "created_at": r.created_at,
        })
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/{recipe_id}", status_code=201)
async def add_favorite(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Favorite).where(Favorite.recipe_id == recipe_id, Favorite.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Уже в избранном")
    db.add(Favorite(recipe_id=recipe_id, user_id=current_user.id))
    await db.commit()
    return {"detail": "Добавлено в избранное"}


@router.delete("/{recipe_id}", status_code=204)
async def remove_favorite(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(Favorite.recipe_id == recipe_id, Favorite.user_id == current_user.id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Не найдено в избранном")
    await db.delete(fav)
    await db.commit()
