import os
import logging
import atexit
import sys
from datetime import datetime, date, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import current_user, login_required
from flask_migrate import Migrate
from dateutil import parser
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers import SchedulerAlreadyRunningError

from models import db, login_manager, Task, Priority, Status
from auth import auth_bp
from services.task_manager import TaskManager
from services.validation import ValidationService

from config import Config, DevelopmentConfig, ProductionConfig, TestingConfig

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Scheduler setup – module level (only one per process)
# -------------------------------------------------------------------
scheduler = BackgroundScheduler()


def _shutdown_scheduler():
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
    except Exception:
        pass


atexit.register(_shutdown_scheduler)


def heartbeat_job():
    """Simple heartbeat to confirm the scheduler is alive."""
    logger.info("Scheduler heartbeat – alive and ticking.")


def start_scheduler(app):
    """Start the scheduler unless we are in testing, a CLI command, reloader parent, or non-designated worker."""
    if app.config.get('TESTING'):
        logger.info("Testing mode – scheduler not started.")
        return
    if 'flask' in sys.argv[0] and len(sys.argv) > 1:
        return
    if os.environ.get('APSCHEDULER_RUN') == '1':
        _start(app)
        return
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'false':
        _start(app)
        return
    logger.info("Scheduler not started in this worker.")


def _start(app):
    """Add scheduler jobs – only if not already running."""
    if scheduler.running:
        return

    # Heartbeat
    scheduler.add_job(
        func=lambda: app.app_context().push() or heartbeat_job(),
        trigger='interval',
        seconds=60,
        id='heartbeat',
        replace_existing=True
    )

    from services.reminder import scan_reminders
    scheduler.add_job(
        func=lambda: _run_with_context(app, scan_reminders),
        trigger='interval',
        minutes=1,
        id='scan_reminders',
        replace_existing=True
    )

    from services.reminder import clear_notified_cache
    scheduler.add_job(
        func=lambda: _run_with_context(app, clear_notified_cache),
        trigger='cron',
        hour=0,
        minute=0,
        id='clear_notified_cache',
        replace_existing=True
    )

    try:
        scheduler.start()
        logger.info("APScheduler started (heartbeat + reminder scanner).")
    except SchedulerAlreadyRunningError:
        logger.info("APScheduler already running – skipping.")


def _run_with_context(app, func):
    """Push an application context, call the function, and pop the context."""
    with app.app_context():
        func()


# -------------------------------------------------------------------
# App factory
# -------------------------------------------------------------------
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
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

    # -------------------------------------------------------------
    # Health‑check
    # -------------------------------------------------------------
    @app.route('/')
    def index():
        return {'status': 'ok', 'service': 'Personal Task Manager API'}

    # -------------------------------------------------------------
    # CRUD routes – thin controllers
    # -------------------------------------------------------------
    @app.route('/api/tasks', methods=['GET'])
    @login_required
    def get_tasks():
        filters = {}
        priority = request.args.get('priority')
        status = request.args.get('status')
        category = request.args.get('category')
        if priority:
            filters['priority'] = priority
        if status:
            filters['status'] = status
        if category:
            filters['category'] = category

        sort = request.args.get('sort', 'created_at')
        direction = request.args.get('dir', 'desc')

        search = request.args.get('q')

        valid_sorts = ['created_at', 'due_date', 'priority', 'title', 'status']
        if sort not in valid_sorts:
            return jsonify({'error': f"Invalid sort field. Must be one of {valid_sorts}"}), 400
        if direction not in ['asc', 'desc']:
            return jsonify({'error': 'Invalid direction. Must be asc or desc'}), 400

        if priority and not ValidationService._is_valid_priority(priority):
            return jsonify({'error': f"Invalid priority value: {priority}"}), 400
        if status and not ValidationService._is_valid_status(status):
            return jsonify({'error': f"Invalid status value: {status}"}), 400

        tasks = task_manager.list(
            user_id=current_user.id,
            filters=filters,
            sort=sort,
            direction=direction,
            search=search
        )
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

    # -------------------------------------------------------------
    # Dashboard 
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

    # -------------------------------------------------------------
    # Notifications 
    # -------------------------------------------------------------
    from services.reminder import notification_queue

    @app.route('/api/notifications', methods=['GET'])
    @login_required
    def get_notifications():
        user_id = current_user.id
        user_notifs = [n for n in notification_queue
                       if n['user_id'] == user_id and not n['seen']]
        user_notifs.sort(key=lambda n: n['id'], reverse=True)
        return jsonify(user_notifs)

    @app.route('/api/notifications/<int:notification_id>/seen', methods=['PUT'])
    @login_required
    def mark_notification_seen(notification_id):
        user_id = current_user.id
        for notif in notification_queue:
            if notif['id'] == notification_id and notif['user_id'] == user_id:
                notif['seen'] = True
                return jsonify({'success': True})
        return jsonify({'error': 'Notification not found'}), 404

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
