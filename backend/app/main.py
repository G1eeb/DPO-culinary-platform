from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.routers import auth, users, recipes, comments, ratings, favorites, follows, notifications, feed, admin


async def _create_default_admin() -> None:
    """Создаёт первого администратора из переменных окружения, если его ещё нет."""
    if not (settings.ADMIN_USERNAME and settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD):
        return

    from app.models.user import User, UserRole
    from app.services.auth import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        if result.scalar_one_or_none():
            return  # уже существует

        admin_user = User(
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(admin_user)
        await db.commit()
        print(f"[startup] Создан администратор: {settings.ADMIN_USERNAME}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _create_default_admin()
    yield


app = FastAPI(
    title="Кулинарная платформа",
    description="API для социальной сети кулинаров",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["ratings"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])
app.include_router(follows.router, prefix="/api/follows", tags=["follows"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(feed.router, prefix="/api/feed", tags=["feed"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
