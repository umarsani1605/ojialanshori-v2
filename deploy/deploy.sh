#!/usr/bin/env bash
# Deploy ke VPS dengan aaPanel (PM2)
# Build lokal → rsync .output/ → restart PM2 via SSH
#
# Prasyarat:
#   - App sudah dikonfigurasi di aaPanel > Node Projects
#   - PM2 app name sesuai PM2_APP (default: ojialanshori)
#   - SSH key sudah ditambahkan ke VPS
#
# Pakai: ./deploy/deploy.sh
# Override: SSH_HOST=user@host APP_DIR=/path PM2_APP=name ./deploy/deploy.sh

set -euo pipefail

SSH_HOST="${SSH_HOST:-root@ojialanshori.com}"
APP_DIR="${APP_DIR:-/www/wwwroot/ojialanshori}"
PM2_APP="${PM2_APP:-ojialanshori}"
NODE_OPTS="${NODE_OPTS:---max-old-space-size=8192}"

echo "==> Building locally (preset: node-server)…"
NODE_OPTIONS="${NODE_OPTS}" pnpm build

echo "==> Sync .output ke VPS: ${APP_DIR}/.output/"
rsync -az --delete \
  --exclude='node_modules' \
  .output/ \
  "${SSH_HOST}:${APP_DIR}/.output/"

echo "==> Install sharp di VPS (linux binary)…"
ssh "${SSH_HOST}" "cd ${APP_DIR}/.output/server && npm install --omit=dev --no-package-lock --silent sharp"

echo "==> Restart app via PM2…"
ssh "${SSH_HOST}" "pm2 restart ${PM2_APP}"

echo "==> Done! Cek: ssh ${SSH_HOST} 'pm2 logs ${PM2_APP} --lines 20'"
