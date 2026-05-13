from models import db, User, Task, Priority, Status


def _make_user(app, google_id, email, name="X"):
    with app.app_context():
        u = User(google_id=google_id, email=email, name=name, profile_pic="")
        db.session.add(u)
        db.session.commit()
        return u.id


def _add_task(app, user_id, title="task", priority=Priority.MEDIUM,
              status=Status.PENDING):
    with app.app_context():
        t = Task(title=title, priority=priority, status=status,
                 user_id=user_id)
        db.session.add(t)
        db.session.commit()
        return t.id


def _login(client, user_id):
    with client.session_transaction() as sess:
        sess["_user_id"] = str(user_id)
        sess["_fresh"] = True


def test_get_tasks_only_returns_own(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    b = _make_user(app, "g_b", "b@example.com")
    _add_task(app, a, title="A1")
    _add_task(app, a, title="A2")
    _add_task(app, b, title="B1")

    _login(client, a)
    resp = client.get("/api/tasks")
    assert resp.status_code == 200
    titles = sorted(t["title"] for t in resp.get_json())
    assert titles == ["A1", "A2"]


def test_put_other_users_task_is_404(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    b = _make_user(app, "g_b", "b@example.com")
    b_task = _add_task(app, b, title="B1")

    _login(client, a)
    resp = client.put(f"/api/tasks/{b_task}", json={"title": "hijacked"})
    assert resp.status_code == 404

    with app.app_context():
        assert db.session.get(Task, b_task).title == "B1"


def test_delete_other_users_task_is_404(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    b = _make_user(app, "g_b", "b@example.com")
    b_task = _add_task(app, b, title="B1")

    _login(client, a)
    resp = client.delete(f"/api/tasks/{b_task}")
    assert resp.status_code == 404

    with app.app_context():
        assert db.session.get(Task, b_task) is not None


def test_post_writes_current_user_id(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    _login(client, a)

    resp = client.post("/api/tasks", json={"title": "mine"})
    assert resp.status_code == 201
    new_id = resp.get_json()["id"]

    with app.app_context():
        assert db.session.get(Task, new_id).user_id == a


def test_dashboard_scoped_to_user(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    b = _make_user(app, "g_b", "b@example.com")
    _add_task(app, a, title="A-pending")
    _add_task(app, b, title="B-pending")
    _add_task(app, b, title="B-done", status=Status.COMPLETED)

    _login(client, a)
    resp = client.get("/api/tasks/dashboard")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total"] == 1
    assert body["pending"] == 1
    assert body["completed"] == 0
    assert body["overdue"] == 0
    assert body["due_today"] == 0


def test_filter_scoped_to_user(app, client):
    a = _make_user(app, "g_a", "a@example.com")
    b = _make_user(app, "g_b", "b@example.com")
    _add_task(app, a, title="A-high", priority=Priority.HIGH)
    _add_task(app, b, title="B-high", priority=Priority.HIGH)

    _login(client, a)
    resp = client.get("/api/tasks/filter?priority=high")
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.get_json()]
    assert titles == ["A-high"]


def test_unauthenticated_request_is_rejected(app, client):
    resp = client.get("/api/tasks")
    assert resp.status_code in (401, 302)
