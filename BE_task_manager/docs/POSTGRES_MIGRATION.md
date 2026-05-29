# PostgreSQL Migration Path – Spike

## What would change

- **Dependencies:** Add `psycopg2-binary` or `psycopg` to `requirements.txt`.
- **Configuration:** Change `SQLALCHEMY_DATABASE_URI` from `sqlite:///database.db` to `postgresql://user:pass@host/dbname`. Use environment variable `DATABASE_URL`.
- **Connection Pooling:** Flask‑SQLAlchemy defaults to a pool of 5 connections. For production, adjust `SQLALCHEMY_ENGINE_OPTIONS` (e.g., `{"pool_size": 10, "max_overflow": 20}`).
- **Migrations:** Alembic works unchanged. Run `flask db upgrade` on the new PostgreSQL database.
- **Data Migration:** Use `pgloader` or a custom Python script to copy data from SQLite to PostgreSQL.

## Effort estimate

- **Low (2–4 hours)** for a developer familiar with PostgreSQL. Most work is setting up the database and updating the connection string.

## Risks

- **Data type incompatibilities** – SQLite’s flexible typing vs. PostgreSQL strictness. Our schema uses standard types (INTEGER, TEXT, DATETIME) which map cleanly.
- **Performance** – PostgreSQL will likely be faster, but connection pooling must be configured correctly.
- **Locking** – SQLite’s write‑serialization is replaced by PostgreSQL’s row‑level locking; existing queries work unchanged.

## Recommended approach

- Use the same `SQLALCHEMY_DATABASE_URI` pattern; switch via environment variable (`DATABASE_URL`).
- Add a `db_backup` script that can dump both SQLite and PostgreSQL.

## Conclusion

Migration is straightforward and low‑risk. The application is ready to move to PostgreSQL if higher concurrency or write scalability becomes necessary.
