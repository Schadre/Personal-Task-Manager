import pytest
import tempfile
import os
from app import create_app
from models import db, User, Task, Priority, Status


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


@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(
            google_id="test_google_123",
            email="test@example.com",
            name="Test User",
            profile_pic=""
        )
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def init_database(app, test_user):
    with app.app_context():
        user = db.session.merge(test_user)
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
def auth_client(client, test_user):
    with client.session_transaction() as sess:
        sess['_user_id'] = str(test_user.id)
        sess['_fresh'] = True
    return client
