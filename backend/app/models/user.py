import enum
from datetime import datetime

from sqlalchemy import String, Text, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)

    avatar_url: Mapped[str | None] = mapped_column(String(500))
    cover_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # relationships
    recipes: Mapped[list["Recipe"]] = relationship(back_populates="author", cascade="all, delete-orphan")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    following: Mapped[list["Follow"]] = relationship(foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete-orphan")
    followers: Mapped[list["Follow"]] = relationship(foreign_keys="Follow.following_id", back_populates="following", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")
