import logging
from datetime import datetime, timedelta
from collections import deque
from models import db, Task, Status

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# In‑memory notification store (shared across the whole process)
# -------------------------------------------------------------------
notification_queue = deque()
_notified_task_ids = set()


def scan_reminders():
    """Find tasks due within the next 24 hours and queue a notification
    for each one that hasn't already been notified in this window."""
    now = datetime.utcnow()
    window_end = now + timedelta(hours=24)

    tasks = Task.query.filter(
        Task.status == Status.PENDING,
        Task.due_date >= now,
        Task.due_date <= window_end
    ).all()

    for task in tasks:
        if task.id in _notified_task_ids:
            continue

        notification = {
            'id': len(notification_queue) + 1,   # simple auto‑increment id
            'task_id': task.id,
            'task_title': task.title,
            'due_date': task.due_date.isoformat(),
            'user_id': task.user_id,
            'seen': False
        }
        notification_queue.append(notification)
        _notified_task_ids.add(task.id)
        logger.info(f"Reminder queued for task {task.id} ('{task.title}')")


def clear_notified_cache():
    """Reset the duplicate‑prevention set at midnight so the same task
    can be re‑notified if it's still pending in the next 24h window."""
    global _notified_task_ids
    _notified_task_ids.clear()
    logger.info("Cleared reminder notification cache for new day.")
