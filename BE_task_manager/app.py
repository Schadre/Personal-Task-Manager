import os
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import event

from models import Task, db

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
FRONTEND_DIST = REPO_ROOT / "FE_task_manager" / "dist"
DB_PATH = os.environ.get("TASKMGR_DB_PATH", str(BASE_DIR / "database.db"))

# Make sure the database folder exists before SQLite opens the file
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)


def task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else None,
        "priority": task.priority or "medium",
        "category": task.category or "Uncategorized",
        "status": task.status or "pending",
    }


with app.app_context():
    @event.listens_for(db.engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

    db.create_all()


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "env": os.environ.get("TASKMGR_ENV", "dev")})


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400

    due_date_str = data.get("due_date")
    due_date = None

    if due_date_str:
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

    task = Task(
        title=title,
        description=description,
        due_date=due_date,
        priority=data.get("priority", "medium"),
        category=data.get("category", "Uncategorized"),
        status=data.get("status", "pending"),
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(task_to_dict(task)), 201


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task_to_dict(task) for task in tasks])


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = data.get("title", "").strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400
        task.title = title

    if "description" in data:
        task.description = data.get("description", "").strip()

    if "status" in data:
        task.status = data.get("status", task.status)

    if "priority" in data:
        task.priority = data.get("priority", task.priority)

    if "category" in data:
        task.category = data.get("category", task.category)

    if "due_date" in data:
        due_date_str = data.get("due_date")

        if due_date_str:
            try:
                task.due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400
        else:
            task.due_date = None

    db.session.commit()

    return jsonify(task_to_dict(task))


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = db.session.get(Task, task_id)

    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted"})


@app.route("/api/dashboard")
def dashboard():
    pending = []
    completed = []
    overdue = []
    today = datetime.today().date()

    for task in Task.query.all():
        if task.status == "completed":
            completed.append(task.title)
        elif task.due_date:
            due_date = task.due_date.date()
            if due_date < today:
                overdue.append(task.title)
            else:
                pending.append(task.title)
        else:
            pending.append(task.title)

    return jsonify({
        "pending": pending,
        "completed": completed,
        "overdue": overdue,
    })


@app.route("/api/tasks/filter")
def filter_tasks():
    priority = request.args.get("priority")

    if not priority:
        return jsonify([])

    tasks = Task.query.filter_by(priority=priority).all()
    return jsonify([task_to_dict(task) for task in tasks])


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
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "5000")),
        debug=True,
    )
