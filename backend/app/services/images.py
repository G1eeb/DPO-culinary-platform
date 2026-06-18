import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException
from PIL import Image

from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def save_image(file: UploadFile, subfolder: str = "recipes") -> str:
    """Сохраняет загруженное изображение, ресайзит до MAX_IMAGE_SIZE и возвращает относительный путь."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Допустимые форматы: JPEG, PNG, WebP")

    dest_dir = Path(settings.MEDIA_DIR) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest_path = dest_dir / filename

    contents = await file.read()

    # Ресайз через Pillow
    from io import BytesIO
    img = Image.open(BytesIO(contents))
    img = img.convert("RGB")
    max_side = settings.MAX_IMAGE_SIZE
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(dest_path, optimize=True, quality=85)

    return f"/media/{subfolder}/{filename}"


def delete_image(url: str) -> None:
    """Удаляет файл по относительному URL /media/..."""
    if not url or not url.startswith("/media/"):
        return
    rel = url.removeprefix("/media/")
    path = Path(settings.MEDIA_DIR) / rel
    if path.exists():
        path.unlink(missing_ok=True)
