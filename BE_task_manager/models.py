from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum as PyEnum

db = SQLAlchemy()


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


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text)
    # CHANGED from String
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(
        db.Enum(Priority), default=Priority.MEDIUM, nullable=False)
    category = db.Column(db.String(50), default='Uncategorized')
    status = db.Column(db.Enum(Status), default=Status.PENDING, nullable=False)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)

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
