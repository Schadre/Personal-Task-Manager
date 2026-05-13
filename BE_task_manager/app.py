import os
import logging
from datetime import datetime, date, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import current_user, login_required
from flask_migrate import Migrate
from dateutil import parser
from apscheduler.schedulers.background import BackgroundScheduler

from models import db, login_manager, Task, Priority, Status
from auth import auth_bp
from services.task_manager import TaskManager
from services.validation import ValidationService

from config import Config, DevelopmentConfig, ProductionConfig

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Scheduler setup
# -------------------------------------------------------------------
scheduler = BackgroundScheduler()


def heartbeat_job():
    """Simple heartbeat to confirm the scheduler is alive."""
    logger.info("Scheduler heartbeat – alive and ticking.")


def start_scheduler(app):
    """Start the scheduler unless we are in testing, or we're the reloader parent, or we're a non-designated worker."""
    if app.config.get('TESTING'):
        logger.info("Testing mode – scheduler not started.")
        return

    if os.environ.get('APSCHEDULER_RUN') == '1':
        _start()
        return

    if os.environ.get('WERKZEUG_RUN_MAIN') != 'false':
        _start()
        return

    logger.info("Scheduler not started in this worker.")


def _start():
    scheduler.add_job(
        func=heartbeat_job,
        trigger='interval',
        seconds=60,
        id='heartbeat',
        replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler started (heartbeat every 60s).")


# -------------------------------------------------------------------
# App factory
# -------------------------------------------------------------------
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': Config
}

task_manager = TaskManager()
validator = ValidationService()
migrate = Migrate()


def parse_iso_datetime(date_str):
    dt = parser.isoparse(date_str)
    if dt.tzinfo is not None:
        dt = dt.astimezone(dt.tzinfo).replace(tzinfo=None)
    return dt


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    CORS(app, resources={
        r"/api/*": {"origins": os.environ.get("CORS_ORIGIN", "http://localhost:5173")},
        r"/auth/*": {"origins": os.environ.get("CORS_ORIGIN", "http://localhost:5173")}
    }, supports_credentials=True)

    app.register_blueprint(auth_bp)


    start_scheduler(app)

    @app.teardown_appcontext
    def shutdown_scheduler(exception=None):
        if scheduler.running:
            scheduler.shutdown()
            logger.info("Scheduler shut down.")

    # -------------------------------------------------------------
    # CRUD routes – thin controllers
    # -------------------------------------------------------------

    @app.route('/')
    def index():
        return {'status': 'ok', 'service': 'Personal Task Manager API'}

    @app.route('/api/tasks', methods=['GET'])
    @login_required
    def get_tasks():
        tasks = task_manager.list(user_id=current_user.id)
        return jsonify([t.to_dict() for t in tasks])

    @app.route('/api/tasks', methods=['POST'])
    @login_required
    def create_task():
        data = request.get_json() or {}
        errors = validator.validate_create(data)
        if errors:
            return jsonify({'error': 'Validation failed', 'fields': errors}), 400

        task = task_manager.create(user_id=current_user.id, data=data)
        return jsonify(task.to_dict()), 201

    @app.route('/api/tasks/<int:task_id>', methods=['PUT'])
    @login_required
    def update_task(task_id):
        data = request.get_json() or {}
        errors = validator.validate_update(data)
        if errors:
            return jsonify({'error': 'Validation failed', 'fields': errors}), 400

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
