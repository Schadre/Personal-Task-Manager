# Operations Runbook

How the Personal Task Manager runs in production and how to set it up or
recover it. Covers the host layout, services, deploys, backups, and the
common recovery steps.

## Overview

- Two environments on one Linux host:
  - prod — `app.business-tempo.com`, served from `/srv/task-manager/prod`
  - dev — `dev.business-tempo.com`, served from `/srv/task-manager/dev`
- Each environment is a Flask API (gunicorn) that also serves the built
  React SPA, with its own SQLite database and Python venv.
- Public traffic comes in through a Cloudflare Tunnel (`cloudflared`), so
  there are no inbound ports open on the host. Both apps listen only on
  localhost (prod 5000, dev 5001).
- A dedicated Redis instance backs the reminder scheduler's leader lock so
  only one gunicorn worker runs the background jobs.
- Deploys are driven by GitHub Actions over SSH; see `.github/workflows/deploy.yml`
  and `scripts/deploy.sh`.

## Host layout

```
/srv/task-manager/
  prod/                 # prod checkout (git), .venv, FE build, data/
  dev/                  # dev checkout, .venv, FE build, data/
  redis/                # dedicated Redis data dir + redis.conf
  backups/              # nightly SQLite backups (prod)
/var/log/task-manager/  # gunicorn access/error logs per env
```

Everything runs as the `deploy` user.

## Services (systemd)

Unit files are tracked in `scripts/systemd/`. Install them by copying to
`/etc/systemd/system/` and reloading.

| Unit | Purpose |
|------|---------|
| `task-manager-prod.service` | gunicorn for prod (127.0.0.1:5000, 3 workers) |
| `task-manager-dev.service` | gunicorn for dev (127.0.0.1:5001, 2 workers) |
| `task-manager-redis.service` | dedicated Redis (127.0.0.1:6379) using `redis/redis.conf` |
| `task-manager-backup.service` + `.timer` | nightly prod DB backup at ~03:00 |

Common commands:

```
sudo systemctl status task-manager-prod
sudo systemctl restart task-manager-prod
journalctl -u task-manager-prod -n 100 --no-pager
systemctl list-timers | grep task-manager-backup
```

## First-time host setup

Assumes the repo is checked out at `/srv/task-manager/<env>` and Node 20 and
Python 3.12 are available.

1. Create the deploy user and directories (owned by `deploy:deploy`):
   `/srv/task-manager/{prod,dev,redis,backups}` and `/var/log/task-manager`.

2. Redis (dedicated instance, localhost only):
   ```
   sudo apt-get install -y redis-server
   sudo systemctl disable --now redis-server   # don't run the shared default
   sudo install -d -o deploy -g deploy /srv/task-manager/redis
   sudo cp scripts/systemd/redis.conf /srv/task-manager/redis/redis.conf
   sudo cp scripts/systemd/task-manager-redis.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now task-manager-redis
   redis-cli -h 127.0.0.1 -p 6379 ping   # expect PONG
   ```

3. App services:
   ```
   sudo cp scripts/systemd/task-manager-prod.service /etc/systemd/system/
   sudo cp scripts/systemd/task-manager-dev.service  /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now task-manager-prod task-manager-dev
   ```
   Each env needs `BE_task_manager/.env` with `SECRET_KEY`, `GOOGLE_CLIENT_ID`,
   and `GOOGLE_CLIENT_SECRET` (not in the repo).

4. Backups (prod):
   ```
   sudo cp scripts/systemd/task-manager-backup.service /etc/systemd/system/
   sudo cp scripts/systemd/task-manager-backup.timer   /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now task-manager-backup.timer
   ```

5. Cloudflare Tunnel: `cloudflared` runs as its own service and maps the two
   hostnames to `127.0.0.1:5000` (prod) and `127.0.0.1:5001` (dev). It holds
   its own credentials outside the repo.

## Deploys

- Push to `dev` deploys the dev site; push to `main` deploys prod.
- The workflow SSHes in, resets the checkout to `origin/<branch>`, and runs
  `scripts/deploy.sh <env>`, which builds the frontend, syncs the venv, runs
  `flask db upgrade`, restarts the service, then verifies `/api/health` returns
  200 and the DB migration head matches the code. A failed verification fails
  the deploy.
- Manual deploy: `gh workflow run deploy.yml -f environment=prod` (or `dev`).

## Backups and restore

- Nightly backup writes `/srv/task-manager/backups/database-YYYYMMDD-HHMMSS.db`
  using SQLite's online-backup API, keeping 7 days.
- Run one on demand: `sudo systemctl start task-manager-backup.service`
- Restore a backup over the live prod DB:
  ```
  scripts/restore-sqlite.sh /srv/task-manager/backups/database-<timestamp>.db
  ```
  It stops the service, saves the current DB alongside, swaps in the backup,
  fixes ownership/mode, and restarts.

## Recovery: common problems

**App returns 500s / won't start after a deploy**
- `journalctl -u task-manager-prod -n 100` and check `/var/log/task-manager/prod-error.log`.
- Usual causes: a Python dependency missing from the venv
  (`/srv/task-manager/prod/.venv/bin/pip install -r BE_task_manager/requirements.txt`)
  or the DB not migrated.

**"no such table" / migration errors**
- Check head vs DB:
  ```
  cd /srv/task-manager/prod/BE_task_manager
  TASKMGR_ENV=prod TASKMGR_DB_PATH=/srv/task-manager/prod/data/database.db \
    /srv/task-manager/prod/.venv/bin/python -m flask --app app db current
  ```
  If it's behind, back up first (`sudo systemctl start task-manager-backup.service`),
  then run `... db upgrade`.

**Duplicate reminders / scheduler firing in every worker**
- Redis must be reachable on 127.0.0.1:6379. Check `task-manager-redis` is
  active and `redis-cli ping` returns PONG. The leader-lock key is
  `scheduler:leader`. After a restart, exactly one worker logs
  "This worker is the leader."

**Deploy reports success but nothing changed**
- Confirm the service restart timestamp moved
  (`systemctl show task-manager-prod -p ActiveEnterTimestamp`). The post-deploy
  verification step should now catch this and fail the deploy.

**Roll back a bad release**
- Redeploy the previous good commit (reset the branch and push, or
  `gh workflow run deploy.yml`), and restore the DB backup if the schema changed.
