from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[str | None] = mapped_column(String(50))
    unit: Mapped[str | None] = mapped_column(String(30))  # г, мл, шт, ст.л. и др.

    recipe: Mapped["Recipe"] = relationship(back_populates="ingredients")
