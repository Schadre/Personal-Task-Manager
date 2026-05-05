import pytest
import tempfile
import os
from app import app as flask_app
from models import db, Task

@pytest.fixture(scope='function')
def app():
    fd, db_path = tempfile.mkstemp(suffix='.db')
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.drop_all()
        os.close(fd)
        os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def init_database(app):
    with app.app_context():
        task1 = Task(title='Write tests', status='pending', priority='high')
        task2 = Task(title='Review PR', status='completed', priority='medium')
        db.session.add_all([task1, task2])
        db.session.commit()
        yield db
