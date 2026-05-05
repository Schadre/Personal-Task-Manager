from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()


class Priority(enum.Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

    def __str__(self):
        return self.name.lower()


class Status(enum.Enum):
    PENDING = 1
    COMPLETED = 2

    def __str__(self):
        return self.name.lower()


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.String(2000), nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.Enum(Priority), nullable=False,
                         default=Priority.MEDIUM)
    category = db.Column(db.String(50), default='Uncategorized')
    status = db.Column(db.Enum(Status), nullable=False, default=Status.PENDING)
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority.name.lower() if self.priority else 'medium',
            'category': self.category or '',
            'status': self.status.name.lower() if self.status else 'pending',
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f'<Task {self.id}: {self.title[:20]}>'
