from datetime import datetime
from pydantic import BaseModel

from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    text: str
    parent_id: int | None = None


class CommentOut(BaseModel):
    id: int
    text: str
    parent_id: int | None
    user: UserPublic
    created_at: datetime
    replies: list["CommentOut"] = []
    model_config = {"from_attributes": True}


CommentOut.model_rebuild()
