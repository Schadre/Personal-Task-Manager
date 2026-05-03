from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.String(10))
    category = db.Column(db.String(50))
    status = db.Column(db.String(10), default="pending")
