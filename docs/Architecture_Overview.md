# Architectural Design — Personal Task Management System

**Team:** Echo (Schadre Dent, Maryam Jumah, Andrew Lahman)
**Course:** CSC480A — Computer Science Capstone Project I
**Document version:** 2.0

---

## 1. Purpose

This document presents the architectural design for the Personal Task Management System and the roadmap from its current state to the target state. It is anchored to five UML diagrams and explains the rationale behind the major design decisions.

The document is written **future-tense by default** — it describes the target architecture we are building toward over the capstone's sprints — and uses inline **Current state** callouts to flag where the deployed code differs from the target.

| View | Diagram | Purpose |
|---|---|---|
| Behavioral (entry) | `Use_Case_Diagram.drawio` | Actors, system boundary, and the user-visible operations |
| Structural | `Class_Diagram.drawio` | Classes, attributes, methods, relationships |
| Behavioral (flow) | `Activity_Diagram.drawio` | User flows through the main task operations |
| Architectural | `Layered_Architecture.drawio` | System layers and component placement |
| Data | `Data_Model.drawio` | Entities, attributes, types, and constraints |

---

## 2. Current State vs. Target State (one-pager)

> The single table the rest of the document hangs off. Everything below either describes the **target** and notes the gap, or describes the **current** state and notes when the gap will close.

| Concern | Target architecture | What's deployed today | Gap closes in |
|---|---|---|---|
| Application style | React SPA + Flask REST API + SQLite | Same (basic) | n/a — already aligned |
| Hosting | Self-hosted Linux + Cloudflare Tunnel; `dev` and `prod` environments | Same, deployed | n/a — already aligned |
| CI/CD | Push to `dev` / `main` triggers GitHub Actions → SSH deploy | Same, operational | n/a — already aligned |
| Application service layer | `TaskManager`, `ReminderService`, `ValidationService`, `FilterSortService` | None — Flask routes do everything inline | Sprint 2–3 refactor |
| Domain types | `Priority`, `Status` Python enums; `Task` with full schema | Plain string columns; minimal `Task` model | Sprint 2 schema migration |
| Reminders / overdue notifications | `ReminderService` scans tasks and emits events | Not implemented; only the dashboard derives overdue status on read | New epic, sprint 3+ |
| Filtering / sorting | `FilterSortService` applied to task collection | UI control exists (`SearchFilter`) but is not wired up | Sprint 2 |
| Validation | Dedicated `ValidationService` enforcing rules | Inline `if not data.get("title")` in route handlers | Sprint 2–3 refactor |
| Persistence | SQLite via SQLAlchemy ORM; Alembic migrations for schema evolution | SQLite via SQLAlchemy ORM; no migration framework yet | Sprint 2 (add Alembic) |
| Authentication | Single-user, no auth (capstone scope) | Same | n/a — out of scope for v1 |

---

## 3. System Overview

The Personal Task Management System is a **single-user, web-based task manager** delivered as a React single-page application that talks to a Flask REST API, with SQLite as the persistence layer. It is intentionally narrow in scope: no multi-user collaboration, no real-time features, no enterprise workflow. The system targets students and working professionals who need a lightweight tool for tracking their own commitments.

The architecture has been chosen to satisfy the proposal's non-functional requirements: response time under 2 seconds for any user action, 99% availability during normal usage, no data loss between sessions, and the ability to handle 400–500 tasks without degradation.

**Deployment.** The application is self-hosted on a Linux server and exposed to the public internet via Cloudflare Tunnel rather than open ingress ports. Two parallel environments exist:

- `https://app.business-tempo.com` — production, tracks the `main` branch
- `https://dev.business-tempo.com` — development, tracks the `dev` branch

Pushes to either branch trigger a GitHub Actions workflow that SSHes into the host as the `deploy` user and runs the server-side deploy script (`/srv/task-manager/bin/deploy {dev|prod}`), which pulls the new commit, rebuilds the Vite frontend, syncs the Python virtualenv, and restarts the matching `task-manager-{dev|prod}` systemd unit.

---

## 4. Architectural Style

We adopted a **layered architecture** spanning a client/server boundary. There are four logical layers: a browser-side **Presentation Layer** and three server-side layers (**Application**, **Domain**, **Data Access**), backed by SQLite as the persistence engine.

```
Browser:   [ Presentation Layer (React SPA) ]
                     │  HTTPS / JSON over /api/*
                     ▼
Server:    [ Application Layer (Flask routes + future service classes) ]
           [ Domain Layer (Task model + Priority/Status enums) ]
           [ Data Access Layer (SQLAlchemy ORM) ]
                     │
Storage:   [ SQLite file ]
```

**Why layered?** It directly addresses three of our requirements:

- **Maintainability** — bug fixes and feature changes can be confined to a single layer without ripple effects.
- **Portability** — the SQLAlchemy ORM lets us swap SQLite for PostgreSQL or MySQL by changing only the `SQLALCHEMY_DATABASE_URI`. A heavier abstraction layer (e.g., a `StorageInterface`) was considered but rejected as over-engineering at our single-user scale; the ORM already provides the abstraction we need.
- **Testability** — server-side service classes (planned: `TaskManager`, `ValidationService`, etc.) are pure Python with no Flask or HTTP dependencies, so they can be unit-tested without spinning up a server.

We considered a single-tier monolith for simplicity but rejected it because the client/server split is required by the React + REST stack we chose.

---

## 5. Layer Responsibilities

Refer to **`Layered_Architecture.drawio`** for the full diagram.

### 5.1 Presentation Layer (React SPA)

Browser-side React components built with Vite and styled with Tailwind. The Presentation Layer **only** depends on the Application Layer's HTTP API — it never touches the database or domain types directly.

Implemented components (`FE_task_manager/src/components/`):

- **`Sidebar`** — primary navigation; "Add Task" trigger
- **`Header`** — page title and global controls
- **`StatsCards`** — counts (pending / completed / total) computed from the task list
- **`TaskTable`** — renders the list with complete and delete actions
- **`AddTaskModal`** — create-task form

Planned (target state):

- **`SearchFilter`** — UI exists today but is not wired to any filtering logic. Will be connected to a server-side filter endpoint in Sprint 2.
- **`EditTaskModal`** — edit-existing-task form. Today the only way to edit is mark-complete or delete; full field editing is part of the Task Creation & Management epic (SCRUM-2, Sprint 2).
- **`NotificationDisplay`** — surfaces reminder events. Depends on the Reminder feature, which is a future epic.

> **Current state:** `AddTaskModal` only submits `title`. Full field set (description, due date, priority, category) is scoped for the Sprint 1–2 task-creation work (SCRUM-7).

### 5.2 Application Layer (Flask)

Server-side orchestration. The **target state** is a thin Flask routing layer (`app.py`) that delegates business logic to dedicated service classes. The **current state** has the routing layer but no service classes — all logic lives inline in the route handlers.

| Component | Purpose | Current state |
|---|---|---|
| Flask routes (`app.py`) | HTTP entry points; URL-to-function mapping | ✅ Implemented: `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/<id>`, `GET /api/dashboard`, `GET /api/tasks/filter`, `GET /api/health` |
| `TaskManager` | Coordinates CRUD, applies validation, persists changes | ⏳ Planned (Sprint 2–3 refactor). Currently inline in route handlers. |
| `ReminderService` | Periodically scans tasks for upcoming due dates and emits reminder events | ⏳ Planned. New epic, not yet in backlog. |
| `ValidationService` | Enforces input rules (title required, due date in future, etc.) | ⏳ Planned. Currently `if not data.get("title")` inline in the create route. |
| `FilterSortService` | Applies filter and sort criteria to a task collection | ⏳ Planned. Currently a single `/api/tasks/filter?priority=` endpoint covers a subset. |

Extracting these services from the routes is the bulk of Sprint 2–3 backend work. Each refactor is a discrete ticket (see §12).

### 5.3 Domain Layer

The shared vocabulary of the system: the `Task` model and the `Priority` and `Status` enums.

| Type | Target | Current state |
|---|---|---|
| `Task` (SQLAlchemy model) | Full field set (see §6) | Implemented with reduced field set; no `created_at` / `updated_at` |
| `Priority` enum | Python `Enum`: Low (1), Medium (2), High (3), with sort ordering | Stored as plain `String(10)` — no enum type |
| `Status` enum | Python `Enum`: Pending, Completed | Stored as plain `String(10)` |

> **Current state:** Both enums are deferred for a Sprint 2 refactor that will introduce `enum.Enum` subclasses, a SQLAlchemy `Enum` column type, and a database migration.

### 5.4 Data Access Layer

Implemented as **SQLAlchemy ORM used directly from the route handlers and (in target state) from service classes**. We deliberately do not introduce a separate `StorageInterface` abstraction; the ORM already abstracts the SQL dialect, and at our scale a second layer of indirection adds no value.

Persistence is a SQLite file:

- Locally: `BE_task_manager/database.db`
- Deployed: `/srv/task-manager/{env}/data/database.db`

The database path is overridable via the `TASKMGR_DB_PATH` environment variable.

> **Current state:** No database migrations are managed. Schema changes today require dropping and recreating the database. Adding **Alembic** (the standard SQLAlchemy migration tool) is a Sprint 2 ticket.

---

## 6. Data Representation

Refer to **`Data_Model.drawio`** for the full diagram.

The persisted data model is a single `Task` entity. This reflects the single-user, single-table nature of the system.

### Target schema

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `id` | Integer | PK, auto-increment, NOT NULL | Primary key. Integer (not UUID) is appropriate for a single-tenant system; UUIDs add cost without benefit at this scale. |
| `title` | String(140) | NOT NULL | Task title. 140 chars matches a tweet-length convention. |
| `description` | String(2000) | nullable | Free-form notes. |
| `due_date` | DateTime | nullable | When the task is due. Stored as a real timestamp (not a string) so date arithmetic works. |
| `priority` | Enum (`Priority`) | default `Medium` | Low / Medium / High, with numeric ordering for sorts. |
| `category` | String(50) | nullable | Free-form tag. |
| `status` | Enum (`Status`) | default `Pending` | Pending / Completed. |
| `created_at` | DateTime | NOT NULL, auto-set | Record creation timestamp; used for default sort. |
| `updated_at` | DateTime | NOT NULL, auto-managed | Last modification timestamp. |

### Current schema (what's in the code today)

| Field | Type today | Gap to close |
|---|---|---|
| `id` | Integer, PK, auto-increment | ✅ aligned |
| `title` | `String(100)` | Bump to 140 (small ticket) |
| `description` | `String(300)` | Bump to 2000 (small ticket) |
| `due_date` | `String(50)` | Convert to `DateTime` + write a migration |
| `priority` | `String(10)` | Replace with `Enum(Priority)` |
| `category` | `String(50)` | ✅ aligned |
| `status` | `String(10)` | Replace with `Enum(Status)` |
| `created_at`, `updated_at` | (missing) | Add columns + auto-management |

### Derived state

- **Overdue.** Computed at read time as `status == Pending AND due_date < now()`. Never persisted. This avoids the inconsistency problem of having to update tasks in storage as time passes. Implemented today in the `dashboard()` view in `BE_task_manager/app.py`.
- **Reminders.** Will be derived from `Task.due_date` at runtime by the planned `ReminderService` and held in memory only. Persisting reminders would create a dual-source-of-truth problem.

> **Current state:** Reminders are not implemented. The `Overdue` derivation exists in the dashboard endpoint and is the closest current-state match to the data-model spec.

### Persistence format

SQLite single-file database, accessed through the SQLAlchemy ORM. At our 500-task scale no indexes beyond the primary key are required — full table scans for filtering remain sub-millisecond. **Alembic** will manage schema evolution once introduced (Sprint 2 ticket).

---

## 7. Design Decisions and Rationale

| Decision | Rationale |
|---|---|
| Layered architecture across a client/server boundary | Matches the React + REST stack; gives clean separation between UI, business logic, and data access; supports independent testing and deployment of frontend and backend. |
| Single `Task` entity | Single-user system has no users table; categories are flat strings rather than a normalized table because the proposal scope explicitly lists category as a free-form tag. |
| **SQLite via SQLAlchemy ORM** | Zero operational overhead; file-based backup is trivial; ORM portability lets us swap to PostgreSQL by changing the connection URL when scale demands. |
| **No `StorageInterface` abstraction layer** | The SQLAlchemy ORM already abstracts the SQL dialect. At single-user scale a second indirection layer adds no value and obscures the code. (This is a deliberate change from earlier design discussions.) |
| **Self-hosted + Cloudflare Tunnel ingress** | No inbound ports opened on the server; free TLS at Cloudflare's edge; free DDoS protection; deploy-host stays invisible to public scans. |
| **Two long-lived environments (`dev`, `prod`) with branch-based auto-deploy** | Standard promotion workflow — work-in-progress on `dev`, stable on `main`; each push to either branch updates its environment within ~30 seconds via GitHub Actions. |
| Service-layer split (TaskManager / ReminderService / ValidationService / FilterSortService) — **planned** | Keeps Flask routes thin and testable; isolates business logic from HTTP concerns; lets the same logic be reused if we add a CLI or admin script later. |
| Overdue and Reminder as **derived** state | Eliminates the bug class where stored state drifts from clock state. Computed on every read. |

---

## 8. Mapping to Non-Functional Requirements

| NFR (from proposal) | How the architecture supports it |
|---|---|
| **Performance** — < 2 s per action | Local-network API round-trip is < 50 ms; gunicorn with multiple workers handles concurrent requests; SQLite reads/writes are sub-millisecond at 500-task scale. |
| **Reliability** — no data loss between sessions | SQLAlchemy session commits are atomic; SQLite write-ahead logging (WAL) protects against partial writes; the database file lives on persistent disk on the deployed server. |
| **Scalability** — 400–500 tasks | SQLite handles this with no indexing required. If the limit is exceeded, swapping to PostgreSQL requires only a connection-string change. |
| **Maintainability** — updates without breaking | Layered separation; planned service-layer refactor will let unit tests cover business logic without standing up a server; `dev` environment lets changes be validated end-to-end before promotion. |
| **Portability** — modern browsers, no install for end-users | Single Flask process plus a static Vite build; deployable to any Linux host with Python 3.12 + Node 20; users only need a browser. |
| **Security** — protect from unauthorized access | TLS terminated at Cloudflare's edge; Cloudflare Tunnel never exposes server ports to the public internet; backend binds only to `127.0.0.1`. **Authentication is intentionally out of scope for v1** — the system runs as a single-user, single-tenant trust-based deployment. Adding auth (Flask-Login or session-based JWT) is in the future-work section. |

---

## 9. Future Considerations

The architecture is positioned for three growth paths:

1. **Database scale-up.** Replace SQLite with PostgreSQL by changing `SQLALCHEMY_DATABASE_URI`; run `alembic upgrade head` against the new database. No model or service changes required.
2. **Multi-user.** Adds an authentication layer (Flask-Login or session-based JWT), a `User` model, and an owner foreign key on `Task`. The layered structure absorbs this without rewrites.
3. **Native mobile.** The Presentation Layer is the only browser-specific piece; the REST API is reusable from a React Native or Flutter shell.

These are explicitly out of scope for the capstone but the architecture does not paint us into a corner.

The CI/CD pipeline already exists: pushes to `dev` and `main` trigger GitHub Actions that SSH into the deploy host and run the server-side deploy script. This is operational infrastructure available today, not a future item.

---

## 10. Diagrams Index

All diagrams are in this `docs/` directory and editable in [draw.io](https://app.diagrams.net):

- **`Use_Case_Diagram.drawio`** — system boundary, the User actor and System Scheduler actor, ten use cases grouped (task management, viewing, organization, notifications), `«extends»` and `«include»` relationships. Use cases drawn with dashed borders are target-state and not yet implemented.
- **`Class_Diagram.drawio`** — server-side classes (Flask route layer, planned service classes, `Task` model, `Priority`/`Status` enums) with attributes, methods, and relationships. Classes drawn with dashed borders are target-state.
- **`Activity_Diagram.drawio`** — user-action workflow with decision diamonds and validation loop. Today validation happens in the route handler; in target state it happens in `ValidationService`.
- **`Layered_Architecture.drawio`** — Presentation / Application / Domain / Data Access layers across the client/server boundary; Cloudflare Tunnel as the ingress; `dev` and `prod` environments. Components drawn with dashed borders are target-state.
- **`Data_Model.drawio`** — `Task` entity with target schema; `Priority` and `Status` enumerations; `Reminder` (derived, in-memory, target-state); `Overdue (derived)` note.

The two `480A_*.drawio` files in this directory are early scratch versions from the initial design phase and are not part of the assignment deliverable.

---

## 11. Known Gaps and Planned Sprint Work

The current code has shipped a working v1 of the core stack. The following items represent the gap between the deployed system and the target architecture described above. Each is a candidate for a Jira ticket; recommended new tickets are listed in §12.

### Backend (service-layer extraction)

- Extract `TaskManager` from inline route logic
- Add `ValidationService` and route every create/update through it
- Add `FilterSortService` and wire `/api/tasks/filter` to it
- Add `ReminderService` (new feature, depends on a scheduler — APScheduler is the likely choice)

### Domain / data model

- Replace `priority` and `status` string columns with SQLAlchemy `Enum(Priority)` / `Enum(Status)` columns
- Convert `due_date` from `String(50)` to `DateTime`
- Add `created_at` and `updated_at` columns with auto-management
- Bump `title` to 140 chars and `description` to 2000 chars
- Introduce **Alembic** for migration management; migrate the existing `dev` and `prod` databases to the new schema

### Frontend

- Wire the existing `SearchFilter` component to the filter endpoint
- Build `EditTaskModal` so tasks can be edited (not just deleted/completed)
- Expand `AddTaskModal` to submit the full field set (description, due date, priority, category)
- Add `NotificationDisplay` once the Reminder feature lands

### Infrastructure (already done — listed for completeness)

- ✅ GitHub repo + branch protection (SCRUM-3, in review)
- ✅ Vite + React app shell (SCRUM-4, in progress)
- ✅ Flask + SQLite persistence layer (SCRUM-5, in progress — note: the original ticket description references localStorage and is now out of date)
- ✅ Cloudflare Tunnel + dev/prod environments + GitHub Actions deploy pipeline

### Out of scope for the capstone

- Authentication / multi-user support
- Cloud database migration (we'll grow into it if needed)
- Native mobile app

---

## 12. Recommended New Jira Tickets

These tickets close the gap between current state and target state. They are recommendations only — the team will decide priority and sprint placement during planning.

| # | Type | Suggested summary | Notes |
|---|---|---|---|
| 1 | Story | Extract `TaskManager` service from Flask route handlers | Sprint 2/3; refactor; depends on tests being in place (SCRUM-6) |
| 2 | Story | Add `ValidationService` and route create/update through it | Sprint 2/3; depends on #1 |
| 3 | Story | Add `FilterSortService` and wire `SearchFilter` UI to it | Sprint 2/3; backend + frontend ticket |
| 4 | Epic | Reminders & overdue notifications | New epic; covers `ReminderService`, scheduler choice (APScheduler), notification UI |
| 5 | Task | Replace `priority` / `status` string columns with Python enums | Sprint 2; small but requires a migration |
| 6 | Task | Convert `due_date` from String to DateTime | Sprint 2; requires a migration; coordinate with frontend date-picker work |
| 7 | Task | Add `created_at` / `updated_at` columns | Sprint 2; small |
| 8 | Task | Introduce Alembic for schema migrations | Sprint 2; blocker for #5–#7 |
| 9 | Task | Bump `title` to 140 and `description` to 2000 | Sprint 2; one-line schema change + migration |
| 10 | Story | `EditTaskModal` — full task editing UI | Part of SCRUM-2 epic |

---

## 13. Summary

The Personal Task Management System is a four-layer client/server web application: a React single-page application backed by a Flask REST API, with SQLite (managed through SQLAlchemy) as the persistence layer. The deployed v1 has the layered structure, the persistence layer, the routing layer, the deployment pipeline, and the core CRUD endpoints in place. The remaining work — service-layer extraction, domain enums, full schema, reminders, full filtering — is captured in the planned-tickets list above and will land across Sprints 2 and 3.

The architecture is small enough to deliver inside the capstone window, structured enough to satisfy the maintainability and portability requirements, and positioned to grow into multi-user and cloud-database capabilities should the project continue beyond capstone.
