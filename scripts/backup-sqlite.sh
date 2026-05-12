#!/usr/bin/env bash
# Nightly SQLite backup with rolling retention.
# Driven by task-manager-backup.timer (see scripts/systemd/).

set -euo pipefail

SRC="${1:-/srv/task-manager/prod/data/database.db}"
DST_DIR="${2:-/srv/task-manager/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"

if [ ! -f "$SRC" ]; then
  echo "source db not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DST_DIR"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
DST="$DST_DIR/database-$STAMP.db"

# Use sqlite3 .backup so the file is consistent even if writers are active
# (works under WAL mode; plain cp does not).
sqlite3 "$SRC" ".backup '$DST'"
chmod 600 "$DST"

find "$DST_DIR" -maxdepth 1 -type f -name 'database-*.db' \
  -mtime "+$RETAIN_DAYS" -delete

echo "backup ok: $DST"
