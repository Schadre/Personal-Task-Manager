from typing import List, Optional, Dict, Any
from datetime import datetime
from models import db, Task, Priority, Status
from services.filter_sort import FilterSortService


class TaskManager:
    """Handles all CRUD operations for tasks."""

    def __init__(self):
        self._filter_sort = FilterSortService()

    def create(self, user_id: int, data: Dict[str, Any]) -> Task:
        """Create a new task for the given user."""
        task = Task(
            user_id=user_id,
            title=data['title'],
            description=data.get('description'),
            due_date=self._parse_date(data.get('due_date')),
            priority=Priority.from_string(data.get('priority', 'medium')),
            status=Status.from_string(data.get('status', 'pending')),
            category=data.get('category')
        )
        db.session.add(task)
        db.session.commit()
        return task

    def update(self, task_id: int, user_id: int, data: Dict[str, Any]) -> Optional[Task]:
        """Update an existing task, ensuring user owns it. Returns updated task or None if not found."""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return None

        for field in ['title', 'description', 'category']:
            if field in data:
                setattr(task, field, data[field])

        if 'due_date' in data:
            task.due_date = self._parse_date(data['due_date'])
        if 'priority' in data and data['priority'] is not None:
            task.priority = Priority.from_string(data['priority'])
        if 'status' in data and data['status'] is not None:
            task.status = Status.from_string(data['status'])

        db.session.commit()
        return task

    def delete(self, task_id: int, user_id: int) -> bool:
        """Delete a task if it exists and belongs to the user. Returns True if deleted."""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return False
        db.session.delete(task)
        db.session.commit()
        return True

    def list(self, user_id: int,
             filters: Optional[Dict[str, Any]] = None,
             sort: str = 'created_at', direction: str = 'desc',
             search: Optional[str] = None) -> List[Task]:
        """Return tasks for a user with optional filtering, sorting, and search."""
        query = Task.query.filter_by(user_id=user_id)

        params: Dict[str, Any] = dict(filters or {})
        if search:
            params['q'] = search
        params['sort'] = sort
        params['dir'] = direction

        return self._filter_sort.apply(query, params).all()

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        try:
            from dateutil import parser
            dt = parser.isoparse(date_str)
            if dt.tzinfo is not None:
                dt = dt.astimezone(dt.tzinfo).replace(tzinfo=None)
            return dt
        except Exception:
            return None
