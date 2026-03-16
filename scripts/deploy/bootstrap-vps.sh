#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
PROJECT_ROOT="${PROJECT_ROOT:-/opt/photo}"

echo "[bootstrap] updating apt index"
sudo apt update

echo "[bootstrap] installing required packages"
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx git rsync ufw

echo "[bootstrap] ensuring deploy user exists"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  sudo adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

echo "[bootstrap] adding user to docker group"
sudo usermod -aG docker "$DEPLOY_USER"

echo "[bootstrap] opening firewall ports"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "[bootstrap] creating project directories"
sudo mkdir -p "$PROJECT_ROOT/current"
sudo mkdir -p "$PROJECT_ROOT/shared/env"
sudo mkdir -p "$PROJECT_ROOT/shared/logs"
sudo mkdir -p /var/www/certbot

echo "[bootstrap] setting ownership"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_ROOT"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/www/certbot

echo "[bootstrap] completed"
echo "Next:"
echo "1. Add SSH key for $DEPLOY_USER"
echo "2. Create $PROJECT_ROOT/shared/env/.env.production"
echo "3. Run docker login ghcr.io"
echo "4. Configure nginx and certbot"
