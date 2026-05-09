#!/usr/bin/env bash
# Deploy script — jalankan dari mesin lokal.
# Build .output/ lalu rsync ke VPS dan restart service.
#
# Prasyarat di VPS (sekali setup):
#   - User www-data ada
#   - /var/www/ojialanshori/shared/.env sudah berisi env vars
#   - systemd unit ojialanshori.service sudah di-enable
#   - Nginx config + SSL sudah aktif
#
# Pakai: ./deploy/deploy.sh
# Override default via env: SSH_HOST=user@host APP_DIR=/path ./deploy/deploy.sh

set -euo pipefail

SSH_HOST="${SSH_HOST:-deploy@ojialanshori.com}"
APP_DIR="${APP_DIR:-/var/www/ojialanshori}"
SERVICE_NAME="${SERVICE_NAME:-ojialanshori}"
NODE_OPTS="${NODE_OPTS:---max-old-space-size=8192}"

RELEASE_TS="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="${APP_DIR}/releases/${RELEASE_TS}"

echo "==> Building locally (preset: node-server)…"
NODE_OPTIONS="${NODE_OPTS}" pnpm build

echo "==> Membuat release dir di VPS: ${RELEASE_DIR}"
ssh "${SSH_HOST}" "mkdir -p ${RELEASE_DIR}"

echo "==> Sync .output ke VPS…"
rsync -az --delete \
  --exclude='node_modules' \
  .output/ \
  "${SSH_HOST}:${RELEASE_DIR}/.output/"

echo "==> Install sharp di VPS (arch-specific binary)…"
# Sharp butuh binary native sesuai arch VPS (linux-x64/arm64), bukan dari local.
ssh "${SSH_HOST}" "cd ${RELEASE_DIR}/.output/server && npm install --omit=dev --no-package-lock --silent sharp"

echo "==> Atomic switch symlink current -> ${RELEASE_TS}"
ssh "${SSH_HOST}" "ln -sfn ${RELEASE_DIR} ${APP_DIR}/current"

echo "==> Restart service ${SERVICE_NAME}…"
ssh "${SSH_HOST}" "sudo systemctl restart ${SERVICE_NAME}"

echo "==> Cleanup release lama (keep 5 latest)…"
ssh "${SSH_HOST}" "cd ${APP_DIR}/releases && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "==> Done. Cek status: ssh ${SSH_HOST} 'systemctl status ${SERVICE_NAME}'"
