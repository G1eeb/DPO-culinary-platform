import enum
from datetime import datetime

from sqlalchemy import ForeignKey, DateTime, func, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    like = "like"
    comment = "comment"
    follow = "follow"
    reply = "reply"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    from_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id", ondelete="SET NULL"))
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(foreign_keys=[user_id], back_populates="notifications")
    from_user: Mapped["User | None"] = relationship(foreign_keys=[from_user_id])
    recipe: Mapped["Recipe | None"] = relationship()
