from datetime import datetime

from sqlalchemy import Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recipe: Mapped["Recipe"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")
    replies: Mapped[list["Comment"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped["Comment | None"] = relationship(back_populates="replies", remote_side="Comment.id")
