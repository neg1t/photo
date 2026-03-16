#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"

docker compose -f "$COMPOSE_FILE" pull
"$ROOT_DIR/scripts/deploy/run-migrations.sh"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker image prune -af --filter "until=168h"
