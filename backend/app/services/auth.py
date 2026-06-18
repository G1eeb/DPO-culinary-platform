from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.config import settings
from app.models.user import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def authenticate_user(db: AsyncSession, login: str, password: str) -> User | None:
    """Аутентификация по username или email."""
    result = await db.execute(
        select(User).where(or_(User.email == login, User.username == login))
    )
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.password_hash):
        return user
    return None
