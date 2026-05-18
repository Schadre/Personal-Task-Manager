import logging
from datetime import datetime, timedelta
from models import db, Task, Status, Notification
from locker import redis_client

logger = logging.getLogger(__name__)


def scan_reminders():
    """Find tasks due within the next 24 hours and create a database notification
    (once per task per 24h window). Uses Redis to deduplicate across workers."""
    now = datetime.utcnow()
    window_end = now + timedelta(hours=24)

    tasks = Task.query.filter(
        Task.status == Status.PENDING,
        Task.due_date >= now,
        Task.due_date <= window_end
    ).all()

    for task in tasks:
        dedupe_key = f"reminder:sent:{task.id}"
        if redis_client.setnx(dedupe_key, "1"):
            redis_client.expire(dedupe_key, 86400)

            notification = Notification(
                task_id=task.id,
                task_title=task.title,
                due_date=task.due_date,
                user_id=task.user_id,
                seen=False
            )
            db.session.add(notification)
            db.session.commit()
            logger.info(
                f"Reminder notification created for task {task.id} ('{task.title}')")
        else:
            logger.debug(
                f"Reminder already sent for task {task.id}, skipping.")


def clear_notified_cache():
    """No longer needed – Redis keys expire automatically. Kept for API compatibility."""
    logger.info(
        "Redis deduplication keys expire automatically; nothing to clear.")
