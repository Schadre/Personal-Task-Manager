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
TMP="$DST.partial"

trap 'rm -f "$TMP"' EXIT

# Online backup so the file is consistent even if writers are active
# (works under WAL mode; plain cp does not). The sqlite3 CLI isn't installed
# on the host, but python3's stdlib exposes the same online-backup API.
# Write to a temp file and rename on success so a failed run never leaves a
# partial .db in place.
PYTHON="${BACKUP_PYTHON:-python3}"
"$PYTHON" - "$SRC" "$TMP" <<'PY'
import sqlite3
import sys

src, dst = sys.argv[1], sys.argv[2]
with sqlite3.connect(src) as source, sqlite3.connect(dst) as dest:
    source.backup(dest)
PY
chmod 600 "$TMP"
mv "$TMP" "$DST"

if [[ "$RETAIN_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  if ! find "$DST_DIR" -maxdepth 1 -type f -name 'database-*.db' \
    -mtime "+$RETAIN_DAYS" -delete; then
    echo "warning: failed to prune backups older than $RETAIN_DAYS days in $DST_DIR" >&2
  fi
else
  echo "warning: invalid RETAIN_DAYS value '$RETAIN_DAYS'; skipping backup pruning" >&2
fi

echo "backup ok: $DST"
