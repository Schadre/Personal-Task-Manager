#!/usr/bin/env bash
# Build, migrate, restart. Called from /srv/task-manager/bin/deploy.

set -euo pipefail

ENV="${1:-}"
case "$ENV" in
  dev)  SERVICE="task-manager-dev"  ;;
  prod) SERVICE="task-manager-prod" ;;
  *)    echo "usage: deploy.sh {dev|prod}" >&2 ; exit 2 ;;
esac

TARGET="/srv/task-manager/$ENV"
export PATH="/opt/node-20/bin:$PATH"

log() { printf '[deploy %s] %s\n' "$ENV" "$*"; }

log "building frontend"
cd "$TARGET/FE_task_manager"
npm install --no-audit --no-fund --silent

# rolldown linux binding sometimes gets skipped by npm
if [ ! -d "node_modules/@rolldown/binding-linux-x64-gnu" ]; then
  ROLLDOWN_VERSION="$(node -p "require('./node_modules/rolldown/package.json').version")"
  npm install --no-save --no-audit --no-fund --silent \
    "@rolldown/binding-linux-x64-gnu@${ROLLDOWN_VERSION}"
fi

npm run build --silent

log "syncing python venv"
cd "$TARGET/BE_task_manager"
[ -d "$TARGET/.venv" ] || python3 -m venv "$TARGET/.venv"
"$TARGET/.venv/bin/pip" install --quiet --upgrade pip
"$TARGET/.venv/bin/pip" install --quiet -r requirements.txt

if [ -d "$TARGET/BE_task_manager/migrations" ]; then
  log "flask db upgrade"
  cd "$TARGET/BE_task_manager"
  # TASKMGR_DB_PATH must match the systemd unit or migrations hit the wrong file
  DB_PATH="$TARGET/data/database.db"
  mkdir -p "$(dirname "$DB_PATH")"
  FLASK_ENV=$( [ "$ENV" = "prod" ] && echo production || echo development )
  TASKMGR_ENV="$FLASK_ENV" TASKMGR_DB_PATH="$DB_PATH" \
    "$TARGET/.venv/bin/python" -m flask --app app db upgrade
fi

if [ "$(systemctl show --property=LoadState --value "$SERVICE.service" 2>/dev/null)" = "loaded" ]; then
  log "restarting $SERVICE"
  sudo /bin/systemctl restart "$SERVICE"
fi

log "done"
