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

# Make sure the directory exists before SQLite tries to open the file
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)
with app.app_context():
    @event.listens_for(db.engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        finally:
            cursor.close()

    db.create_all()


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "env": os.environ.get("TASKMGR_ENV", "dev")})


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json or {}
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    task = Task(
        title=data["title"],
        description=data.get("description"),
        due_date=data.get("due_date"),
        priority=data.get("priority"),
        category=data.get("category"),
        status="pending",
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "task_id": task.id})


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    return jsonify(
        [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date,
            }
            for t in Task.query.all()
        ]
    )


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json or {}
    task.title = data.get("title", task.title)
    task.status = data.get("status", task.status)
    task.priority = data.get("priority", task.priority)
    db.session.commit()
    return jsonify({"message": "Task updated"})


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
    pending, completed, overdue = [], [], []
    today = datetime.today().date()

    for t in Task.query.all():
        if t.status == "completed":
            completed.append(t.title)
        elif t.due_date:
            try:
                due = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                (overdue if due < today else pending).append(t.title)
            except ValueError:
                pending.append(t.title)
        else:
            pending.append(t.title)

    return jsonify({"pending": pending, "completed": completed, "overdue": overdue})


@app.route("/api/tasks/filter")
def filter_tasks():
    priority = request.args.get("priority")
    return jsonify([t.title for t in Task.query.filter_by(priority=priority).all()])


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
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=True)
