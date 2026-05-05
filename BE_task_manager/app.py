import os
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from models import Task, db

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
FRONTEND_DIST = REPO_ROOT / "FE_task_manager" / "dist"
DB_PATH = os.environ.get("TASKMGR_DB_PATH", str(BASE_DIR / "database.db"))

app = Flask(__name__, static_folder=None)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)
migrate = Migrate(app, db)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "env": os.environ.get("TASKMGR_ENV", "dev")})


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json or {}
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    due_date_str = data.get("due_date")
    due_date = None
    if due_date_str:
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

    task = Task(
        title=data["title"],
        description=data.get("description", ""),
        due_date=due_date,
        priority=data.get("priority", "medium"),
        category=data.get("category", "Uncategorized"),
        status="pending",
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "task_id": task.id})


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
            "description": t.description or "",
            "category": t.category or "",
        })
    return jsonify(result)


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json or {}
    task.title = data.get("title", task.title)
    task.status = data.get("status", task.status)
    task.priority = data.get("priority", task.priority)
    task.description = data.get("description", task.description)
    task.category = data.get("category", task.category)

    if "due_date" in data:
        due_str = data["due_date"]
        if due_str:
            try:
                task.due_date = datetime.strptime(due_str, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400
        else:
            task.due_date = None

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
    pending = []
    completed = []
    overdue = []
    today = datetime.today().date()

    for t in Task.query.all():
        if t.status == "completed":
            completed.append(t.title)
        elif t.due_date:
            due_date = t.due_date.date()
            if due_date < today:
                overdue.append(t.title)
            else:
                pending.append(t.title)
        else:
            pending.append(t.title)

    return jsonify({"pending": pending, "completed": completed, "overdue": overdue})


@app.route("/api/tasks/filter")
def filter_tasks():
    priority = request.args.get("priority")
    if not priority:
        return jsonify([])
    tasks = Task.query.filter_by(priority=priority).all()
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
        os.environ.get("PORT", "5000")), debug=True)
