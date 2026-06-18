import enum
from datetime import datetime

from sqlalchemy import String, Text, Integer, ForeignKey, Enum, DateTime, func, Index
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.tag import recipe_tags


class Cuisine(str, enum.Enum):
    italian = "italian"
    japanese = "japanese"
    russian = "russian"
    french = "french"
    mexican = "mexican"
    chinese = "chinese"
    indian = "indian"
    georgian = "georgian"
    mediterranean = "mediterranean"
    american = "american"
    other = "other"


class Category(str, enum.Enum):
    breakfast = "breakfast"
    soups = "soups"
    main = "main"
    salads = "salads"
    desserts = "desserts"
    baking = "baking"
    snacks = "snacks"
    drinks = "drinks"
    sauces = "sauces"
    other = "other"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cook_time: Mapped[int | None] = mapped_column(Integer)
    servings: Mapped[int] = mapped_column(Integer, default=1)
    cover_url: Mapped[str | None] = mapped_column(String(500))

    cuisine: Mapped[Cuisine] = mapped_column(Enum(Cuisine), default=Cuisine.other)
    category: Mapped[Category] = mapped_column(Enum(Category), default=Category.other)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), default=Difficulty.easy)

    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    search_vector: Mapped[str | None] = mapped_column(TSVECTOR)

    author: Mapped["User"] = relationship(back_populates="recipes")
    ingredients: Mapped[list["Ingredient"]] = relationship(back_populates="recipe", cascade="all, delete-orphan", order_by="Ingredient.id")
    steps: Mapped[list["Step"]] = relationship(back_populates="recipe", cascade="all, delete-orphan", order_by="Step.order")
    tags: Mapped[list["Tag"]] = relationship(secondary=recipe_tags, back_populates="recipes")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_recipes_search_vector", "search_vector", postgresql_using="gin"),
    )
