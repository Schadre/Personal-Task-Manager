import os
from datetime import datetime, date, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import current_user, login_required
from dateutil import parser

from models import db, login_manager, Task, Priority, Status
from auth import auth_bp
from services.task_manager import TaskManager

from config import Config, DevelopmentConfig, ProductionConfig

config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': Config
}

task_manager = TaskManager()


def parse_iso_datetime(date_str):
    dt = parser.isoparse(date_str)
    if dt.tzinfo is not None:
        dt = dt.astimezone(dt.tzinfo).replace(tzinfo=None)
    return dt


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    login_manager.init_app(app)

    CORS(app, resources={
        r"/api/*": {"origins": os.environ.get("CORS_ORIGIN", "http://localhost:5173")},
        r"/auth/*": {"origins": os.environ.get("CORS_ORIGIN", "http://localhost:5173")}
    }, supports_credentials=True)

    app.register_blueprint(auth_bp)

    # -------------------------------------------------------------
    # CRUD routes – thin controllers
    # -------------------------------------------------------------
    @app.route('/api/tasks', methods=['GET'])
    @login_required
    def get_tasks():
        tasks = task_manager.list(user_id=current_user.id)
        return jsonify([t.to_dict() for t in tasks])

    @app.route('/api/tasks', methods=['POST'])
    @login_required
    def create_task():
        data = request.get_json() or {}
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        try:
            task = task_manager.create(user_id=current_user.id, data=data)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        return jsonify(task.to_dict()), 201

    @app.route('/api/tasks/<int:task_id>', methods=['PUT'])
    @login_required
    def update_task(task_id):
        data = request.get_json() or {}
        task = task_manager.update(task_id, user_id=current_user.id, data=data)
        if task is None:
            return jsonify({'error': 'Task not found'}), 404
        return jsonify(task.to_dict())

    @app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
    @login_required
    def delete_task(task_id):
        success = task_manager.delete(task_id, user_id=current_user.id)
        if not success:
            return jsonify({'error': 'Task not found'}), 404
        return '', 204

    # -------------------------------------------------------------
    # Dashboard & filter – unchanged for now
    # -------------------------------------------------------------
    @app.route('/api/tasks/dashboard', methods=['GET'])
    @login_required
    def dashboard():
        tasks = Task.query.filter_by(user_id=current_user.id).all()
        today = date.today()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == Status.COMPLETED)
        pending = total - completed
        overdue = sum(1 for t in tasks if t.status !=
                      Status.COMPLETED and t.due_date and t.due_date.date() < today)
        due_today = sum(1 for t in tasks if t.status !=
                        Status.COMPLETED and t.due_date and t.due_date.date() == today)
        return jsonify({
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue,
            'due_today': due_today
        })

    @app.route('/api/tasks/filter', methods=['GET'])
    @login_required
    def filter_tasks():
        priority = request.args.get('priority')
        if priority:
            try:
                priority_enum = Priority.from_string(priority)
            except ValueError:
                return jsonify({'error': 'Invalid priority'}), 400
            tasks = Task.query.filter_by(
                user_id=current_user.id, priority=priority_enum
            ).order_by(Task.created_at.desc()).all()
        else:
            tasks = Task.query.filter_by(user_id=current_user.id).order_by(
                Task.created_at.desc()).all()
        return jsonify([t.to_dict() for t in tasks])

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
