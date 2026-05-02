# 📝 Task Manager (Full-Stack)

A simple full-stack task management application built with **React (Vite)** on the frontend and **Flask + SQLite** on the backend.

---

## 🚀 Features

* Create, update, and delete tasks
* Mark tasks as completed
* View task statistics (pending, completed, total)
* Filter and organize tasks
* Clean dashboard-style UI

---

## 🛠️ Tech Stack

**Frontend**

* React (Vite)
* Tailwind CSS

**Backend**

* Flask
* SQLAlchemy
* SQLite

---

## ⚠️ Important Notes

* Make sure the Flask server is running before using the frontend
* If Tailwind styles are not showing:

  * Ensure Tailwind v3 is installed (not v4)
  * Verify `postcss.config.js` exists
* Enable CORS in Flask if API requests fail

---

## 📌 API Endpoints

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| GET    | `/tasks`     | Fetch all tasks   |
| POST   | `/tasks`     | Create a new task |
| PUT    | `/tasks/:id` | Update a task     |
| DELETE | `/tasks/:id` | Delete a task     |

---

## 📷 Future Improvements

* Authentication (login/signup)
* Task categories & tags
* Drag-and-drop task management
* Deployment (Render)

---

## 💡 About

This project was built as part of a **full-stack learning journey**, focusing on connecting a React frontend with a Flask backend and handling real-world CRUD operations.

---
