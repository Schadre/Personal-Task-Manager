#!/usr/bin/env bash
# Restore a backup file over the live prod database.
# Stops the service, snapshots the current db alongside, swaps in the backup,
# restarts.

set -euo pipefail

SRC="${1:?usage: restore-sqlite.sh <backup-file> [target-db]}"
DST="${2:-/srv/task-manager/prod/data/database.db}"
SERVICE="${SERVICE:-task-manager-prod}"

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
sudo systemctl start "$SERVICE"

echo "restored from $SRC"
