#!/usr/bin/env bash
# Build, migrate, restart. Called from .github/workflows/deploy.yml after
# the workflow has reset the working tree to origin/<branch>.

set -euo pipefail

ENV="${1:-}"
case "$ENV" in
  dev)  SERVICE="task-manager-dev"  ;;
  prod) SERVICE="task-manager-prod" ;;
  *)    echo "usage: deploy.sh {dev|prod}" >&2 ; exit 2 ;;
esac

TARGET="/srv/task-manager/$ENV"
export PATH="/opt/node-20/bin:$PATH"

# TASKMGR_DB_PATH must match the systemd unit or migrations hit the wrong file
DB_PATH="$TARGET/data/database.db"
TASKMGR_ENV_NAME=$( [ "$ENV" = "prod" ] && echo production || echo development )
PORT=$( [ "$ENV" = "prod" ] && echo 5000 || echo 5001 )

log() { printf '[deploy %s] %s\n' "$ENV" "$*"; }

flask_db() {
  TASKMGR_ENV="$TASKMGR_ENV_NAME" TASKMGR_DB_PATH="$DB_PATH" \
    "$TARGET/.venv/bin/python" -m flask --app app db "$@"
}

log "writing FE env from VITE_GOOGLE_CLIENT_ID"
: "${VITE_GOOGLE_CLIENT_ID:?VITE_GOOGLE_CLIENT_ID must be set}"
printf 'VITE_GOOGLE_CLIENT_ID=%s\n' "$VITE_GOOGLE_CLIENT_ID" > "$TARGET/FE_task_manager/.env"

log "building frontend"
cd "$TARGET/FE_task_manager"
npm ci --no-audit --no-fund --silent

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
"$TARGET/.venv/bin/pip" install --quiet -r requirements.txt

if [ -d "$TARGET/BE_task_manager/migrations" ]; then
  log "flask db upgrade"
  cd "$TARGET/BE_task_manager"
  mkdir -p "$(dirname "$DB_PATH")"
  flask_db upgrade
fi

if [ "$(systemctl show --property=LoadState --value "$SERVICE.service" 2>/dev/null)" = "loaded" ]; then
  log "restarting $SERVICE"
  sudo /bin/systemctl restart "$SERVICE"
fi

# Post-deploy verification. A failure here exits non-zero, which fails the
# SSH command in the deploy workflow, so a broken deploy shows up red
# instead of silently reporting success.
cd "$TARGET/BE_task_manager"

log "verifying health on port $PORT"
health=""
for _ in $(seq 1 10); do
  code=$(curl --connect-timeout 2 --max-time 5 -s -o /dev/null \
    -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" || printf '000')
  if [ "$code" = "200" ]; then health=ok; break; fi
  sleep 2
done
if [ -z "$health" ]; then
  echo "[deploy $ENV] health check failed (last status: ${code:-none})" >&2
  exit 1
fi
log "health ok"

log "verifying migration head"
current=$(flask_db current 2>/dev/null | grep -oE '[0-9a-f]{12}' | head -1 || true)
head=$(flask_db heads 2>/dev/null | grep -oE '[0-9a-f]{12}' | head -1 || true)
if [ -z "$current" ] || [ "$current" != "$head" ]; then
  echo "[deploy $ENV] migration mismatch: current=${current:-none} head=${head:-none}" >&2
  exit 1
fi
log "migration head ok ($current)"

log "done"
