from models import db, Task, Priority, Status
from app import app as flask_app
from datetime import datetime
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_task_round_trip(tmp_path):
    db_path = tmp_path / "test.db"
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with flask_app.app_context():
        db.create_all()

        due_date = datetime(2025, 12, 31, 23, 59, 59)
        original_task = Task(
            title="Round-trip test",
            description="This task should survive write/read",
            due_date=due_date,
            priority=Priority.HIGH,
            category="Testing",
            status=Status.COMPLETED
        )
        db.session.add(original_task)
        db.session.commit()
        task_id = original_task.id

        db.session.remove()

        fetched_task = db.session.get(Task, task_id)

        assert fetched_task.id == task_id
        assert fetched_task.title == original_task.title
        assert fetched_task.description == original_task.description
        assert fetched_task.due_date == original_task.due_date
        assert fetched_task.priority == original_task.priority
        assert fetched_task.category == original_task.category
        assert fetched_task.status == original_task.status
        assert fetched_task.created_at is not None
        assert fetched_task.updated_at is not None
        assert isinstance(fetched_task.created_at, datetime)
        assert isinstance(fetched_task.updated_at, datetime)
