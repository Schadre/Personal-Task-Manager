import pytest
from datetime import datetime
from models import Task, Priority, Status


def test_task_round_trip(app):
    with app.app_context():
        from models import db, User
        user = User(
            google_id="roundtrip_user",
            email="roundtrip@example.com",
            name="Roundtrip User"
        )
        db.session.add(user)
        db.session.commit()

        due_date = datetime(2025, 12, 31, 23, 59, 59)
        original_task = Task(
            title="Round-trip test",
            description="This task should survive write/read",
            due_date=due_date,
            priority=Priority.HIGH,
            category="Testing",
            status=Status.COMPLETED,
            user_id=user.id
        )
        db.session.add(original_task)
        db.session.commit()
        task_id = original_task.id

        retrieved = db.session.get(Task, task_id)
        assert retrieved.title == original_task.title
        assert retrieved.description == original_task.description
        assert retrieved.due_date == original_task.due_date
        assert retrieved.priority == original_task.priority
        assert retrieved.category == original_task.category
        assert retrieved.status == original_task.status
        assert retrieved.user_id == user.id


def test_task_creation(app):
    with app.app_context():
        from models import db, User
        user = User(
            google_id="creation_user",
            email="creation@example.com",
            name="Creation User"
        )
        db.session.add(user)
        db.session.commit()

        task = Task(title="Test Task", user_id=user.id)
        db.session.add(task)
        db.session.commit()
        assert task.id is not None
