from sqlalchemy import Integer, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="ratings")
    user: Mapped["User"] = relationship(back_populates="ratings")

    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 5", name="ck_rating_score"),
        UniqueConstraint("recipe_id", "user_id", name="uq_rating_recipe_user"),
    )
