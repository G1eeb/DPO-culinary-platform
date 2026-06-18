from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.models.recipe import Recipe, Cuisine, Category, Difficulty
from app.models.ingredient import Ingredient
from app.models.step import Step
from app.models.tag import Tag, recipe_tags
from app.models.rating import Rating
from app.models.favorite import Favorite
from app.models.follow import Follow
from app.schemas.recipe import RecipeCreate, RecipeUpdate


async def get_or_create_tags(db: AsyncSession, names: list[str]) -> list[Tag]:
    tags = []
    for name in names:
        name = name.strip().lower()
        if not name:
            continue
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


async def create_recipe(db: AsyncSession, data: RecipeCreate, author_id: int) -> Recipe:
    recipe = Recipe(
        title=data.title,
        description=data.description,
        cook_time=data.cook_time,
        servings=data.servings,
        cuisine=data.cuisine,
        category=data.category,
        difficulty=data.difficulty,
        author_id=author_id,
    )
    db.add(recipe)
    await db.flush()

    for ing in data.ingredients:
        db.add(Ingredient(recipe_id=recipe.id, name=ing.name, amount=ing.amount, unit=ing.unit))

    for step in data.steps:
        db.add(Step(recipe_id=recipe.id, order=step.order, description=step.description))

    tags = await get_or_create_tags(db, data.tags)
    for tag in tags:
        await db.execute(recipe_tags.insert().values(recipe_id=recipe.id, tag_id=tag.id))

    await db.commit()
    await db.refresh(recipe)
    return recipe


async def get_recipe_with_relations(db: AsyncSession, recipe_id: int) -> Recipe | None:
    result = await db.execute(
        select(Recipe)
        .options(
            selectinload(Recipe.author),
            selectinload(Recipe.ingredients),
            selectinload(Recipe.steps),
            selectinload(Recipe.tags),
            selectinload(Recipe.ratings),
        )
        .where(Recipe.id == recipe_id)
    )
    return result.scalar_one_or_none()


async def get_recipe_rating(db: AsyncSession, recipe_id: int) -> tuple[float | None, int]:
    result = await db.execute(
        select(func.avg(Rating.score), func.count(Rating.id))
        .where(Rating.recipe_id == recipe_id)
    )
    avg, count = result.one()
    return (float(avg) if avg else None), count


async def is_favorited(db: AsyncSession, recipe_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(Favorite).where(Favorite.recipe_id == recipe_id, Favorite.user_id == user_id)
    )
    return result.scalar_one_or_none() is not None


async def list_recipes(
    db: AsyncSession,
    *,
    q: str | None = None,
    cuisine: Cuisine | None = None,
    category: Category | None = None,
    difficulty: Difficulty | None = None,
    cook_time_max: int | None = None,
    tag: str | None = None,
    author_id: int | None = None,
    sort: str = "created_at",
    page: int = 1,
    size: int = 20,
) -> tuple[list[Recipe], int]:
    stmt = (
        select(Recipe)
        .options(selectinload(Recipe.author), selectinload(Recipe.tags), selectinload(Recipe.ratings))
    )

    if q:
        stmt = stmt.where(Recipe.search_vector.op("@@")(func.plainto_tsquery("russian", q)))
    if cuisine:
        stmt = stmt.where(Recipe.cuisine == cuisine)
    if category:
        stmt = stmt.where(Recipe.category == category)
    if difficulty:
        stmt = stmt.where(Recipe.difficulty == difficulty)
    if cook_time_max:
        stmt = stmt.where(Recipe.cook_time <= cook_time_max)
    if author_id:
        stmt = stmt.where(Recipe.author_id == author_id)
    if tag:
        stmt = stmt.join(Recipe.tags).where(Tag.name == tag.lower())

    # count
    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    # sort
    popularity_subq = (
        select(func.count(Rating.id) + func.count(Favorite.id))
        .select_from(Recipe.__table__)
        .outerjoin(Rating, Rating.recipe_id == Recipe.id)
        .outerjoin(Favorite, Favorite.recipe_id == Recipe.id)
        .where(Recipe.id == Recipe.id)
        .correlate(Recipe)
        .scalar_subquery()
    )
    order_col = {
        "created_at": Recipe.created_at.desc(),
        "rating": func.coalesce(
            select(func.avg(Rating.score)).where(Rating.recipe_id == Recipe.id).scalar_subquery(), 0
        ).desc(),
        "popularity": func.coalesce(popularity_subq, 0).desc(),
    }.get(sort, Recipe.created_at.desc())

    stmt = stmt.order_by(order_col).offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)
    return result.scalars().all(), total
