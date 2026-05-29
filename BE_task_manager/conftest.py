import pytest
import tempfile
import os
from datetime import datetime, timedelta
import random

from app import create_app
from models import db, User, Task, Priority, Status, Notification


@pytest.fixture(scope='function')
def app():
    fd, db_path = tempfile.mkstemp(suffix='.db')
    app = create_app('testing')

    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['WTF_CSRF_ENABLED'] = False

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

    os.close(fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client(use_cookies=True)


def _create_user(client, app, google_id, email, name):
    with app.app_context():
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            profile_pic=""
        )
        db.session.add(user)
        db.session.commit()
        with client.session_transaction() as sess:
            sess['_user_id'] = str(user.id)
            sess['_fresh'] = True
        return user


@pytest.fixture
def auth_client(client, app):
    r = random.randint(1, 1000000)
    user = _create_user(client, app,
                        google_id=f"test_google_{r}",
                        email=f"test_{r}@example.com",
                        name="Test User")
    return client


@pytest.fixture
def auth_client_user1(client, app):
    user = _create_user(client, app,
                        google_id="user1_google",
                        email="user1@example.com",
                        name="User One")
    return client


@pytest.fixture
def auth_client_user2(client, app):
    user = _create_user(client, app,
                        google_id="user2_google",
                        email="user2@example.com",
                        name="User Two")
    return client


@pytest.fixture
def auth_user(auth_client, app):
    """Return the user object associated with auth_client."""
    with app.app_context():
        with auth_client.session_transaction() as sess:
            user_id = sess.get('_user_id')
        return User.query.get(int(user_id))


@pytest.fixture
def auth_user1(auth_client_user1, app):
    with app.app_context():
        with auth_client_user1.session_transaction() as sess:
            user_id = sess.get('_user_id')
        return User.query.get(int(user_id))


@pytest.fixture
def auth_user2(auth_client_user2, app):
    with app.app_context():
        with auth_client_user2.session_transaction() as sess:
            user_id = sess.get('_user_id')
        return User.query.get(int(user_id))


@pytest.fixture
def init_database(app):
    with app.app_context():
        user = User.query.filter_by(email='test_google_123').first()
        if not user:
            user = User(
                google_id="test_google_123",
                email="test@example.com",
                name="Test User",
                profile_pic=""
            )
            db.session.add(user)
            db.session.commit()
        task1 = Task(
            title='Write tests',
            status=Status.PENDING,
            priority=Priority.HIGH,
            user_id=user.id
        )
        task2 = Task(
            title='Review PR',
            status=Status.COMPLETED,
            priority=Priority.MEDIUM,
            user_id=user.id
        )
        db.session.add_all([task1, task2])
        db.session.commit()
        yield db


@pytest.fixture
def db_session(init_database):
    return init_database


@pytest.fixture
def task_factory(app):
    def _create_task(**kwargs):
        with app.app_context():
            user_id = kwargs.get('user_id')
            if user_id is None:
                user = User.query.filter_by(email='test@example.com').first()
                if not user:
                    user = User(
                        google_id="test_google_123",
                        email="test@example.com",
                        name="Test User",
                        profile_pic=""
                    )
                    db.session.add(user)
                    db.session.commit()
                user_id = user.id
            defaults = {
                'title': 'Test Task',
                'description': 'Test description',
                'due_date': datetime.utcnow() + timedelta(hours=12),
                'priority': Priority.MEDIUM,
                'status': Status.PENDING,
                'category': 'Test',
                'user_id': user_id
            }
            defaults.update(kwargs)
            if 'priority' in defaults and isinstance(defaults['priority'], str):
                defaults['priority'] = Priority.from_string(
                    defaults['priority'])
            if 'status' in defaults and isinstance(defaults['status'], str):
                defaults['status'] = Status.from_string(defaults['status'])
            task = Task(**defaults)
            db.session.add(task)
            db.session.commit()
            return task.id
    return _create_task


@pytest.fixture
def notification_factory(app):
    def _create_notification(**kwargs):
        with app.app_context():
            user_id = kwargs.get('user_id')
            if user_id is None:
                user = User.query.filter_by(email='test@example.com').first()
                if not user:
                    user = User(
                        google_id="test_google_123",
                        email="test@example.com",
                        name="Test User",
                        profile_pic=""
                    )
                    db.session.add(user)
                    db.session.commit()
                user_id = user.id
            # Create a task for this user if none exists
            task = Task.query.filter_by(user_id=user_id).first()
            if not task:
                task = Task(
                    title='Default Task',
                    user_id=user_id,
                    due_date=datetime.utcnow() + timedelta(days=1)
                )
                db.session.add(task)
                db.session.commit()
            defaults = {
                'task_id': task.id,
                'task_title': 'Test Task',
                'due_date': datetime.utcnow() + timedelta(hours=12),
                'user_id': user_id,
                'seen': False,
                'created_at': datetime.utcnow()
            }
            defaults.update(kwargs)
            notif = Notification(**defaults)
            db.session.add(notif)
            db.session.commit()
            return notif.id
    return _create_notification


@pytest.fixture
def redis_client(monkeypatch):
    class FakeRedis:
        def __init__(self):
            self.data = {}

        def setnx(self, key, value):
            if key not in self.data:
                self.data[key] = value
                return True
            return False

        def expire(self, key, time):
            pass

        def delete(self, key):
            self.data.pop(key, None)

        def get(self, key):
            return self.data.get(key)
    fake = FakeRedis()
    monkeypatch.setattr('services.reminder.redis_client', fake)
    monkeypatch.setattr('locker.redis_client', fake)
    return fake
