#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
until python -c "
import asyncio, asyncpg, os
async def check():
    url = os.environ.get('DATABASE_URL', '')
    # Convert SQLAlchemy URL to asyncpg format
    url = url.replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url)
    await conn.close()
asyncio.run(check())
" 2>/dev/null; do
  echo "[entrypoint] Database not ready, retrying in 2s..."
  sleep 2
done

echo "[entrypoint] Running Alembic migrations..."
alembic upgrade head

echo "[entrypoint] Seeding test data..."
python seed.py

echo "[entrypoint] Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
