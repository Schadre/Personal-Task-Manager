#!/usr/bin/env bash
# Restore a backup file over the live prod database.
# Stops the service, snapshots the current db alongside, swaps in the backup,
# restarts.

set -euo pipefail

SRC="${1:?usage: restore-sqlite.sh <backup-file> [target-db]}"
DST="${2:-/srv/task-manager/prod/data/database.db}"
SERVICE="${SERVICE:-task-manager-prod}"
EXISTING_DB_OWNER=""
EXISTING_DB_MODE=""

if [ -f "$DST" ]; then
  EXISTING_DB_OWNER="$(stat -c '%U:%G' "$DST")"
  EXISTING_DB_MODE="$(stat -c '%a' "$DST")"
fi

DB_OWNER="${DB_OWNER:-${EXISTING_DB_OWNER:-deploy:deploy}}"
DB_MODE="${DB_MODE:-${EXISTING_DB_MODE:-0644}}"

if [ ! -f "$SRC" ]; then
  echo "backup file not found: $SRC" >&2
  exit 1
fi

sudo systemctl stop "$SERVICE"

if [ -f "$DST" ]; then
  PRE="$DST.pre-restore-$(date -u +%Y%m%d-%H%M%S)"
  sudo cp "$DST" "$PRE"
  echo "saved current db -> $PRE"
fi

sudo cp "$SRC" "$DST"
# Backups are written 0600 root-owned via sudo, so reset ownership/mode to
# what the service user expects before bringing the service back up.
sudo chown "$DB_OWNER" "$DST"
sudo chmod "$DB_MODE" "$DST"

sudo systemctl start "$SERVICE"

echo "restored from $SRC"
