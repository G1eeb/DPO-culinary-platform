from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    from_user_id: int | None,
    type: NotificationType,
    recipe_id: int | None = None,
) -> None:
    if user_id == from_user_id:
        return  # не уведомляем о собственных действиях
    notif = Notification(
        user_id=user_id,
        from_user_id=from_user_id,
        type=type,
        recipe_id=recipe_id,
    )
    db.add(notif)
    await db.flush()
