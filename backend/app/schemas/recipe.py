from datetime import datetime
from pydantic import BaseModel

from app.models.recipe import Cuisine, Category, Difficulty
from app.schemas.user import UserPublic


class IngredientIn(BaseModel):
    name: str
    amount: str | None = None
    unit: str | None = None


class IngredientOut(IngredientIn):
    id: int
    model_config = {"from_attributes": True}


class StepIn(BaseModel):
    order: int
    description: str


class StepOut(StepIn):
    id: int
    photo_url: str | None = None
    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    title: str
    description: str | None = None
    cook_time: int | None = None
    servings: int = 1
    cuisine: Cuisine = Cuisine.other
    category: Category = Category.other
    difficulty: Difficulty = Difficulty.easy
    tags: list[str] = []
    ingredients: list[IngredientIn] = []
    steps: list[StepIn] = []


class RecipeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cook_time: int | None = None
    servings: int | None = None
    cuisine: Cuisine | None = None
    category: Category | None = None
    difficulty: Difficulty | None = None
    tags: list[str] | None = None
    ingredients: list[IngredientIn] | None = None
    steps: list[StepIn] | None = None


class RecipeCard(BaseModel):
    id: int
    title: str
    cover_url: str | None
    cook_time: int | None
    servings: int
    cuisine: Cuisine
    category: Category
    difficulty: Difficulty
    author: UserPublic
    avg_rating: float | None = None
    ratings_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


class RecipeDetail(RecipeCard):
    description: str | None
    tags: list[str] = []
    ingredients: list[IngredientOut] = []
    steps: list[StepOut] = []
    is_favorited: bool = False


class RecipeListResponse(BaseModel):
    items: list[RecipeCard]
    total: int
    page: int
    size: int
