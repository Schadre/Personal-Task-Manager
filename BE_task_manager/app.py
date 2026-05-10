import os
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_login import LoginManager, login_required, current_user
from auth import auth_bp
from flask_cors import CORS
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth

from models import Task, db, Priority, Status, User
from config import Config, DevelopmentConfig, ProductionConfig

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
FRONTEND_DIST = REPO_ROOT / "FE_task_manager" / "dist"

env = os.environ.get('TASKMGR_ENV', 'development')
if env == 'production':
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()

app_config.validate() 

Path(app_config.DB_PATH).parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config.from_object(app_config)

allowed_origin = os.environ.get('CORS_ORIGIN', 'http://localhost:5173')
CORS(app, resources={
    r"/api/*": {"origins": allowed_origin},
    r"/auth/*": {"origins": allowed_origin}
}, supports_credentials=True)

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))


oauth = OAuth(app)
oauth.register(
    name='google',
    client_id=app.config['GOOGLE_CLIENT_ID'],
    client_secret=app.config['GOOGLE_CLIENT_SECRET'],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

app.register_blueprint(auth_bp)


def parse_iso_datetime(date_str):
    """Parse ISO-8601 string to naive UTC datetime."""
    if not date_str:
        return None
    try:
        if date_str.endswith('Z'):
            date_str = date_str[:-1] + '+00:00'
        dt = datetime.fromisoformat(date_str)
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Invalid ISO-8601 date format")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "env": env})


@app.route("/api/tasks", methods=["POST"])
@login_required
def create_task():
    data = request.json or {}
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    due_date = None
    if data.get("due_date"):
        try:
            due_date = parse_iso_datetime(data["due_date"])
        except ValueError:
            return jsonify({"error": "Invalid due_date format, use ISO-8601"}), 400

    priority_str = data.get("priority", "medium")
    try:
        priority_enum = Priority.from_string(priority_str)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    status_str = data.get("status", "pending")
    try:
        status_enum = Status.from_string(status_str)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    task = Task(
        title=data["title"],
        description=data.get("description", ""),
        due_date=due_date,
        priority=priority_enum,
        category=data.get("category", "Uncategorized"),
        status=status_enum,
        user_id=current_user.id
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.route("/api/tasks", methods=["GET"])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify([task.to_dict() for task in tasks])


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json or {}

    if "title" in data:
        task.title = data["title"]
    if "description" in data:
        task.description = data["description"]
    if "category" in data:
        task.category = data["category"]

    if "due_date" in data:
        if data["due_date"] is None:
            task.due_date = None
        else:
            try:
                task.due_date = parse_iso_datetime(data["due_date"])
            except ValueError:
                return jsonify({"error": "Invalid due_date format, use ISO-8601"}), 400

    if "priority" in data:
        try:
            task.priority = Priority.from_string(data["priority"])
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    if "status" in data:
        try:
            task.status = Status.from_string(data["status"])
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    db.session.commit()
    return jsonify(task.to_dict())


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})


@app.route("/api/dashboard")
@login_required
def dashboard():
    pending_tasks = []
    completed_tasks = []
    overdue_tasks = []
    today = datetime.today().date()

    for task in Task.query.filter_by(user_id=current_user.id).all():
        if task.status == Status.COMPLETED:
            completed_tasks.append(task.title)
        elif task.due_date:
            due_date = task.due_date.date()
            if due_date < today:
                overdue_tasks.append(task.title)
            else:
                pending_tasks.append(task.title)
        else:
            pending_tasks.append(task.title)

    return jsonify({
        "pending": pending_tasks,
        "completed": completed_tasks,
        "overdue": overdue_tasks
    })


@app.route("/api/tasks/filter")
@login_required
def filter_tasks():
    priority_str = request.args.get("priority")
    if not priority_str:
        return jsonify([])

    try:
        priority_enum = Priority.from_string(priority_str)
    except ValueError:
        return jsonify({"error": "Invalid priority"}), 400

    tasks = Task.query.filter_by(
        priority=priority_enum, user_id=current_user.id).all()
    return jsonify([{"id": t.id, "title": t.title} for t in tasks])


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if not FRONTEND_DIST.exists():
        return jsonify({"error": "frontend not built"}), 503

    target = FRONTEND_DIST / path
    if path and target.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(
        os.environ.get("PORT", "5000")), debug=app.debug)
