from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    due_date = db.Column(db.String(50))
    priority = db.Column(db.String(10))  # low, medium, high
    category = db.Column(db.String(50))  # school, work, personal
    status = db.Column(db.String(10), default="pending")  # pending/completed
