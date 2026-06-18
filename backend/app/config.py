from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://culinary:culinary@localhost:5432/culinary"
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 дней

    MEDIA_DIR: str = "./media"
    MAX_IMAGE_SIZE: int = 1920  # px, по длинной стороне

    # Первый администратор — создаётся автоматически при старте, если не существует
    ADMIN_USERNAME: str | None = None
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None


settings = Settings()
