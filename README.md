# Task Manager (Full-Stack)

A simple full-stack task management application built with **React (Vite)** on the frontend and **Flask + SQLite** on the backend.

---

## Features

* Create, update, and delete tasks
* Mark tasks as completed
* View task statistics (pending, completed, total)
* Filter and organize tasks
* Clean dashboard-style UI

---

## Tech Stack

**Frontend**

* React (Vite)
* Tailwind CSS

**Backend**

* Flask
* SQLAlchemy
* SQLite

---

## Important Notes

* Make sure the Flask server is running before using the frontend
* If Tailwind styles are not showing:

  * Ensure Tailwind v3 is installed (not v4)
  * Verify `postcss.config.js` exists
* Enable CORS in Flask if API requests fail

---

## API Endpoints

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| GET    | `/tasks`     | Fetch all tasks   |
| POST   | `/tasks`     | Create a new task |
| PUT    | `/tasks/:id` | Update a task     |
| DELETE | `/tasks/:id` | Delete a task     |

---

## Database Migrations

We use Alembic (via Flask-Migrate) to manage schema changes without data loss.

### Creating a new migration after changing `models.py`

```bash
cd BE_task_manager
export FLASK_APP=app.py
flask db migrate -m "description of change"
flask db upgrade head
```

## Testing

The frontend uses [Jest](https://jestjs.io/) for unit and integration tests.

### Running Frontend Tests (Jest)

1. Navigate to the frontend folder:
   ```bash
   cd FE_task_manager

2. Install dependencies
    ```bash
   npm install

3. npm test
    ```bash
   npm test

### Running Backend Tests (Flask + pytest)

The backend uses [pytest](https://docs.pytest.org/) and an in‑memory SQLite database for isolation.

1. Navigate to the backend folder:
    ```bash
   cd BE_task_manager

2. Install test dependencies:
    ```bash 
   pip install pytest pytest-cov

3. Run the test suite:
    ```bash
   pytest

---

## Future Improvements

* Drag-and-drop task management
* Deployment (Render)

---

## About

This project was built as part of a **full-stack learning journey**, focusing on connecting a React frontend with a Flask backend and handling real-world CRUD operations.