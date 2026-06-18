from datetime import datetime
from pydantic import BaseModel

from app.models.notification import NotificationType
from app.schemas.user import UserPublic


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    is_read: bool
    from_user: UserPublic | None
    recipe_id: int | None
    created_at: datetime
    model_config = {"from_attributes": True}
