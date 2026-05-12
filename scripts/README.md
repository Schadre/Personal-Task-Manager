# scripts/

Operational scripts for the deployed environments. Most of these are run by
GitHub Actions or systemd, not by hand.

## deploy.sh

Called by `.github/workflows/deploy.yml` after the workflow has reset the
working tree to `origin/<branch>`. Builds the frontend, syncs the python
venv, runs `flask db upgrade`, restarts the relevant service.

## backup-sqlite.sh

Nightly backup of the prod SQLite database to `/srv/task-manager/backups/`,
using `sqlite3 .backup` (safe with WAL writers active). Keeps the last 7
files; older ones are deleted.

Defaults: source `/srv/task-manager/prod/data/database.db`, destination
`/srv/task-manager/backups/`, retention 7 days. Override by passing args or
setting `RETAIN_DAYS`.

### Install on the host (one-time)

```
sudo cp scripts/systemd/task-manager-backup.service /etc/systemd/system/
sudo cp scripts/systemd/task-manager-backup.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now task-manager-backup.timer
```

Verify with `systemctl list-timers | grep task-manager-backup` and
`journalctl -u task-manager-backup.service`.

## restore-sqlite.sh

Restore a backup file over the live prod database. Stops the service,
saves the current db alongside as `database.db.pre-restore-<timestamp>`,
copies the chosen backup in, restarts.

```
scripts/restore-sqlite.sh /srv/task-manager/backups/database-20260512-030014.db
```
