import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# импортируем все модели чтобы они попали в metadata
from app.database import Base
import app.models.user      # noqa: F401
import app.models.tag       # noqa: F401
import app.models.recipe    # noqa: F401
import app.models.ingredient  # noqa: F401
import app.models.step      # noqa: F401
import app.models.rating    # noqa: F401
import app.models.comment   # noqa: F401
import app.models.favorite  # noqa: F401
import app.models.follow    # noqa: F401
import app.models.notification  # noqa: F401

import os

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Переопределяем URL из переменной окружения (нужно для Docker, где хост — db, а не localhost)
if os.environ.get("DATABASE_URL"):
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
