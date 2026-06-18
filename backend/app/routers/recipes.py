from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.user import User, UserRole
from app.models.recipe import Recipe, Cuisine, Category, Difficulty
from app.models.ingredient import Ingredient
from app.models.step import Step
from app.models.tag import recipe_tags
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeDetail, RecipeListResponse, RecipeCard
from app.services import recipes as recipe_service
from app.services.images import save_image, delete_image

router = APIRouter()


def _recipe_to_card(recipe: Recipe, avg: float | None, count: int) -> dict:
    return {
        "id": recipe.id,
        "title": recipe.title,
        "cover_url": recipe.cover_url,
        "cook_time": recipe.cook_time,
        "servings": recipe.servings,
        "cuisine": recipe.cuisine,
        "category": recipe.category,
        "difficulty": recipe.difficulty,
        "author": recipe.author,
        "avg_rating": avg,
        "ratings_count": count,
        "created_at": recipe.created_at,
    }


@router.get("", response_model=RecipeListResponse)
async def list_recipes(
    q: Optional[str] = None,
    cuisine: Optional[Cuisine] = None,
    category: Optional[Category] = None,
    difficulty: Optional[Difficulty] = None,
    cook_time_max: Optional[int] = None,
    tag: Optional[str] = None,
    author_id: Optional[int] = None,
    sort: str = Query("created_at", pattern="^(created_at|rating|popularity)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    recipes, total = await recipe_service.list_recipes(
        db, q=q, cuisine=cuisine, category=category,
        difficulty=difficulty, cook_time_max=cook_time_max,
        tag=tag, author_id=author_id, sort=sort, page=page, size=size,
    )
    items = []
    for r in recipes:
        avg, count = await recipe_service.get_recipe_rating(db, r.id)
        items.append(_recipe_to_card(r, avg, count))
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("", response_model=RecipeDetail, status_code=201)
async def create_recipe(
    data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.create_recipe(db, data, current_user.id)
    full = await recipe_service.get_recipe_with_relations(db, recipe.id)
    avg, count = await recipe_service.get_recipe_rating(db, recipe.id)
    return {**_recipe_to_card(full, avg, count),
            "description": full.description,
            "tags": [t.name for t in full.tags],
            "ingredients": full.ingredients,
            "steps": full.steps,
            "is_favorited": False}


@router.get("/{recipe_id}", response_model=RecipeDetail)
async def get_recipe(
    recipe_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.get_recipe_with_relations(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    avg, count = await recipe_service.get_recipe_rating(db, recipe.id)
    fav = False
    if current_user:
        fav = await recipe_service.is_favorited(db, recipe.id, current_user.id)
    return {**_recipe_to_card(recipe, avg, count),
            "description": recipe.description,
            "tags": [t.name for t in recipe.tags],
            "ingredients": recipe.ingredients,
            "steps": recipe.steps,
            "is_favorited": fav}


@router.patch("/{recipe_id}", response_model=RecipeDetail)
async def update_recipe(
    recipe_id: int,
    data: RecipeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.get_recipe_with_relations(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    if recipe.author_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")

    if data.title is not None:
        recipe.title = data.title
    if data.description is not None:
        recipe.description = data.description
    if data.cook_time is not None:
        recipe.cook_time = data.cook_time
    if data.servings is not None:
        recipe.servings = data.servings
    if data.cuisine is not None:
        recipe.cuisine = data.cuisine
    if data.category is not None:
        recipe.category = data.category
    if data.difficulty is not None:
        recipe.difficulty = data.difficulty
    if data.tags is not None:
        # Удаляем старые теги и вставляем новые напрямую (без lazy load)
        await db.execute(recipe_tags.delete().where(recipe_tags.c.recipe_id == recipe.id))
        tags = await recipe_service.get_or_create_tags(db, data.tags)
        for tag in tags:
            await db.execute(recipe_tags.insert().values(recipe_id=recipe.id, tag_id=tag.id))
    if data.ingredients is not None:
        for ing in recipe.ingredients:
            await db.delete(ing)
        for ing in data.ingredients:
            db.add(Ingredient(recipe_id=recipe.id, name=ing.name, amount=ing.amount, unit=ing.unit))
    if data.steps is not None:
        for step in recipe.steps:
            await db.delete(step)
        for step in data.steps:
            db.add(Step(recipe_id=recipe.id, order=step.order, description=step.description))

    await db.commit()
    updated = await recipe_service.get_recipe_with_relations(db, recipe_id)
    avg, count = await recipe_service.get_recipe_rating(db, recipe_id)
    fav = await recipe_service.is_favorited(db, recipe_id, current_user.id)
    return {**_recipe_to_card(updated, avg, count),
            "description": updated.description,
            "tags": [t.name for t in updated.tags],
            "ingredients": updated.ingredients,
            "steps": updated.steps,
            "is_favorited": fav}


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    if recipe.author_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")
    await db.delete(recipe)
    await db.commit()


@router.post("/{recipe_id}/cover", response_model=RecipeDetail)
async def upload_cover(
    recipe_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await recipe_service.get_recipe_with_relations(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    if recipe.author_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")

    old_url = recipe.cover_url
    url = await save_image(file, subfolder="recipes")
    recipe.cover_url = url
    await db.commit()
    if old_url:
        background_tasks.add_task(delete_image, old_url)

    updated = await recipe_service.get_recipe_with_relations(db, recipe_id)
    avg, count = await recipe_service.get_recipe_rating(db, recipe_id)
    fav = await recipe_service.is_favorited(db, recipe_id, current_user.id)
    return {**_recipe_to_card(updated, avg, count),
            "description": updated.description,
            "tags": [t.name for t in updated.tags],
            "ingredients": updated.ingredients,
            "steps": updated.steps,
            "is_favorited": fav}


@router.post("/{recipe_id}/steps/{step_id}/photo", status_code=200)
async def upload_step_photo(
    recipe_id: int,
    step_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe or recipe.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    from app.models.step import Step
    step_result = await db.execute(select(Step).where(Step.id == step_id, Step.recipe_id == recipe_id))
    step = step_result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Шаг не найден")

    old_url = step.photo_url
    url = await save_image(file, subfolder="steps")
    step.photo_url = url
    await db.commit()
    if old_url:
        background_tasks.add_task(delete_image, old_url)
    return {"photo_url": url}
