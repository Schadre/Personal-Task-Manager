from typing import Any, Optional, Mapping

from sqlalchemy import case

from models import db, Task, Priority, Status


class FilterSortService:
    """Applies filtering, search, and sorting to a Task query.

    Keeps query-shaping logic out of the route layer and TaskManager.
    `apply` takes a SQLAlchemy query plus a request.args-like mapping and
    returns the modified query (it does not execute it).
    """

    VALID_SORTS = ('created_at', 'due_date', 'priority', 'title', 'status')

    SORT_COLUMNS = {
        'created_at': Task.created_at,
        'due_date': Task.due_date,
        'priority': Task.priority,
        'title': Task.title,
        'status': Task.status,
    }

    def apply(self, query, params: Optional[Mapping[str, Any]] = None):
        """Return query with filters, search, and sort applied.

        Recognized keys in params: priority, status, category, q (search),
        sort, dir. Unknown keys are ignored; missing keys are no-ops.
        """
        params = params or {}
        query = self._apply_filters(query, params)
        query = self._apply_search(query, params.get('q'))
        query = self._apply_sort(
            query, params.get('sort', 'created_at'), params.get('dir', 'desc'))
        return query

    def _apply_filters(self, query, params: Mapping[str, Any]):
        priority = params.get('priority')
        status = params.get('status')
        category = params.get('category')
        if priority:
            query = query.filter(
                Task.priority == Priority.from_string(priority))
        if status:
            query = query.filter(Task.status == Status.from_string(status))
        if category:
            query = query.filter(Task.category == category)
        return query

    def _apply_search(self, query, search: Optional[str]):
        if not search:
            return query
        like_pattern = f"%{search}%"
        return query.filter(
            db.or_(Task.title.ilike(like_pattern),
                   Task.description.ilike(like_pattern))
        )

    def _apply_sort(self, query, sort: str, direction: str):
        if sort == 'priority':
            order_col = case(
                (Task.priority == Priority.HIGH, 1),
                (Task.priority == Priority.MEDIUM, 2),
                (Task.priority == Priority.LOW, 3),
                else_=4,
            )
        else:
            order_col = self.SORT_COLUMNS.get(sort, Task.created_at)

        if direction == 'asc':
            order_col = order_col.asc()
        else:
            order_col = order_col.desc()
        return query.order_by(order_col)
