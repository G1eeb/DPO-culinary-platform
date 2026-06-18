from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserPublic(BaseModel):
    id: int
    username: str
    avatar_url: str | None
    cover_url: str | None
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(UserPublic):
    recipes_count: int = 0
    followers_count: int = 0
    following_count: int = 0


class UserMe(UserProfile):
    email: str
    role: str


class UserAdminOut(UserPublic):
    email: str
    role: str


class UserUpdate(BaseModel):
    bio: str | None = None
    username: str | None = None
