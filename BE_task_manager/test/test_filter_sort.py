from datetime import datetime

from models import db, User, Task, Priority, Status
from services.filter_sort import FilterSortService


def _user(app):
    with app.app_context():
        u = User(google_id="fs_user", email="fs@example.com", name="FS")
        db.session.add(u)
        db.session.commit()
        return u.id


def _task(app, user_id, **kw):
    with app.app_context():
        t = Task(
            user_id=user_id,
            title=kw.get("title", "task"),
            description=kw.get("description"),
            priority=kw.get("priority", Priority.MEDIUM),
            status=kw.get("status", Status.PENDING),
            category=kw.get("category"),
            due_date=kw.get("due_date"),
        )
        db.session.add(t)
        db.session.commit()
        return t.id


def _run(app, user_id, params):
    with app.app_context():
        query = Task.query.filter_by(user_id=user_id)
        result = FilterSortService().apply(query, params).all()
        return [t.title for t in result]


def test_no_params_returns_all_default_sort(app):
    uid = _user(app)
    _task(app, uid, title="first")
    _task(app, uid, title="second")
    titles = _run(app, uid, {})
    assert sorted(titles) == ["first", "second"]


def test_filter_by_priority(app):
    uid = _user(app)
    _task(app, uid, title="hi", priority=Priority.HIGH)
    _task(app, uid, title="lo", priority=Priority.LOW)
    assert _run(app, uid, {"priority": "high"}) == ["hi"]


def test_filter_by_status(app):
    uid = _user(app)
    _task(app, uid, title="open", status=Status.PENDING)
    _task(app, uid, title="closed", status=Status.COMPLETED)
    assert _run(app, uid, {"status": "completed"}) == ["closed"]


def test_filter_by_category(app):
    uid = _user(app)
    _task(app, uid, title="work-task", category="Work")
    _task(app, uid, title="home-task", category="Home")
    assert _run(app, uid, {"category": "Work"}) == ["work-task"]


def test_search_matches_title(app):
    uid = _user(app)
    _task(app, uid, title="buy milk")
    _task(app, uid, title="call dentist")
    assert _run(app, uid, {"q": "milk"}) == ["buy milk"]


def test_search_matches_description(app):
    uid = _user(app)
    _task(app, uid, title="t1", description="contains keyword here")
    _task(app, uid, title="t2", description="something else")
    assert _run(app, uid, {"q": "keyword"}) == ["t1"]


def test_combined_priority_and_status(app):
    uid = _user(app)
    _task(app, uid, title="match", priority=Priority.HIGH,
          status=Status.PENDING)
    _task(app, uid, title="wrong-status", priority=Priority.HIGH,
          status=Status.COMPLETED)
    _task(app, uid, title="wrong-priority", priority=Priority.LOW,
          status=Status.PENDING)
    assert _run(app, uid,
                {"priority": "high", "status": "pending"}) == ["match"]


def test_sort_by_title_asc(app):
    uid = _user(app)
    _task(app, uid, title="banana")
    _task(app, uid, title="apple")
    _task(app, uid, title="cherry")
    assert _run(app, uid, {"sort": "title", "dir": "asc"}) == [
        "apple", "banana", "cherry"]


def test_sort_by_priority_orders_high_to_low(app):
    uid = _user(app)
    _task(app, uid, title="low", priority=Priority.LOW)
    _task(app, uid, title="high", priority=Priority.HIGH)
    _task(app, uid, title="medium", priority=Priority.MEDIUM)
    # priority sort is custom HIGH->LOW regardless of asc/desc column type
    assert _run(app, uid, {"sort": "priority", "dir": "asc"}) == [
        "high", "medium", "low"]


def test_sort_by_due_date_desc(app):
    uid = _user(app)
    _task(app, uid, title="earlier", due_date=datetime(2026, 1, 1))
    _task(app, uid, title="later", due_date=datetime(2026, 12, 1))
    assert _run(app, uid, {"sort": "due_date", "dir": "desc"}) == [
        "later", "earlier"]


def test_invalid_sort_falls_back_to_created_at(app):
    uid = _user(app)
    _task(app, uid, title="a")
    _task(app, uid, title="b")
    # should not raise; falls back to created_at ordering
    titles = _run(app, uid, {"sort": "bogus_field"})
    assert sorted(titles) == ["a", "b"]


def test_search_and_filter_together(app):
    uid = _user(app)
    _task(app, uid, title="urgent report", priority=Priority.HIGH)
    _task(app, uid, title="urgent errand", priority=Priority.LOW)
    _task(app, uid, title="casual report", priority=Priority.HIGH)
    # both "report" tasks are HIGH; "urgent errand" excluded on both counts
    result = _run(app, uid, {"q": "report", "priority": "high"})
    assert sorted(result) == ["casual report", "urgent report"]
