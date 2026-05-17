from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum as PyEnum
from flask_login import UserMixin, LoginManager
from sqlalchemy.orm import relationship

db = SQLAlchemy()
login_manager = LoginManager()


class Priority(PyEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

    @classmethod
    def from_string(cls, value: str):
        if not value:
            return cls.MEDIUM
        value_lower = value.lower()
        if value_lower == 'low':
            return cls.LOW
        if value_lower == 'medium':
            return cls.MEDIUM
        if value_lower == 'high':
            return cls.HIGH
        raise ValueError(f"Invalid priority: {value}")

    def to_string(self) -> str:
        return self.name.lower()


class Status(PyEnum):
    PENDING = 'pending'
    COMPLETED = 'completed'

    @classmethod
    def from_string(cls, value: str):
        if not value:
            return cls.PENDING
        value_lower = value.lower()
        if value_lower == 'pending':
            return cls.PENDING
        if value_lower == 'completed':
            return cls.COMPLETED
        raise ValueError(f"Invalid status: {value}")

    def to_string(self) -> str:
        return self.value


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(256), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100))
    profile_pic = db.Column(db.String(500))

    tasks = relationship("Task", back_populates="user",
                         cascade="all, delete-orphan")


class Task(db.Model):
    __tablename__ = 'tasks'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(
        db.Enum(Priority), default=Priority.MEDIUM, nullable=False)
    category = db.Column(db.String(50), default='Uncategorized')
    status = db.Column(db.Enum(Status), default=Status.PENDING, nullable=False)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(
        "users.id"), nullable=False)

    user = relationship("User", back_populates="tasks")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority.to_string() if self.priority else 'medium',
            'category': self.category,
            'status': self.status.to_string() if self.status else 'pending',
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Task {self.id} {self.title}>'


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
