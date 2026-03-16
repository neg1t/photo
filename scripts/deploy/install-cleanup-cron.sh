#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/opt/photo/current}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_FILE="${LOG_FILE:-/opt/photo/shared/logs/cleanup.log}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"

CRON_LINE="$CRON_SCHEDULE cd $PROJECT_ROOT && docker compose -f $COMPOSE_FILE run --rm app pnpm cleanup >> $LOG_FILE 2>&1"

TMP_FILE="$(mktemp)"
crontab -l 2>/dev/null | grep -Fv "pnpm cleanup" > "$TMP_FILE" || true
printf "%s\n" "$CRON_LINE" >> "$TMP_FILE"
crontab "$TMP_FILE"
rm -f "$TMP_FILE"

echo "[cleanup-cron] installed:"
echo "$CRON_LINE"
