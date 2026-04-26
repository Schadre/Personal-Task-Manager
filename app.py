from datetime import datetime
from flask import Flask, request, jsonify
from models import db, Task

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()


@app.route('/')
def home():
    return "Flask API is running!"


@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.json

    if not data or not data.get('title'):
        return jsonify({"Error": "Title is required"}), 400

    new_task = Task(
        title=data['title'],
        description=data.get('description'),
        due_date=data.get('due_date'),
        priority=data.get('priority'),
        category=data.get('category'),
        status="pending"
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "Message": "Task Created",
        "task_id": new_task.id
    })


@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()

    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date
        })

    return jsonify(result)


@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    task = Task.query.get(id)

    if not task:
        return jsonify({"Error": "Task Not Found"}), 404

    data = request.json

    task.title = data.get('title', task.title)
    task.status = data.get('status', task.status)
    task.priority = data.get('priority', task.priority)

    db.session.commit()
    return jsonify({"Message": "Task Updated"})


@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    task = Task.query.get(id)

    if not task:
        return jsonify({"Error": "Task Not Found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"Message": "Task Deleted"})


@app.route('/dashboard', methods=['GET'])
def dashboard():
    tasks = Task.query.all()

    pending = []
    completed = []
    overdue = []

    today = datetime.today().date()

    for t in tasks:
        if t.status == "completed":
            completed.append(t.title)
        elif t.due_date:
            due = datetime.strptime(t.due_date, "%Y-%m-%d").date()
            if due < today:
                overdue.append(t.title)
            else:
                pending.append(t.title)
        else:
            pending.append(t.title)

    return jsonify({
        "pending": pending,
        "completed": completed,
        "overdue": overdue
    })


@app.route('/tasks/filter', methods=['GET'])
def filter_tasks():
    priority = request.args.get('priority')

    tasks = Task.query.filter_by(priority=priority).all()

    return jsonify([t.title for t in tasks])


if __name__ == '__main__':
    app.run(debug=True)
