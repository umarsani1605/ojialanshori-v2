# Deploy ke VPS + Nginx

Panduan deploy Omah Ngaji Al-Anshori (Nuxt 4 + Node SSR) ke VPS dengan Nginx reverse proxy.

## Prasyarat di VPS

Asumsi VPS sudah punya:
- Node.js >= 20 (`node --version`)
- Nginx (`nginx -v`)
- MySQL (`mysql --version`)
- `sudo` access dan user deploy non-root

Yang masih perlu disiapkan: certbot untuk SSL (`apt install certbot python3-certbot-nginx`).

## Layout direktori di VPS

```
/var/www/ojialanshori/
├── current  -> releases/20260509-103000/   # symlink ke release aktif
├── releases/
│   └── 20260509-103000/
│       └── .output/                        # hasil build
└── shared/
    └── .env                                # env vars (sekali setup, tidak di-overwrite)
```

## Setup awal di VPS (sekali saja)

### 1. Buat user & direktori

```bash
sudo useradd -r -s /bin/bash -d /var/www/ojialanshori www-data 2>/dev/null || true  # biasanya sudah ada
sudo mkdir -p /var/www/ojialanshori/{releases,shared}
sudo chown -R www-data:www-data /var/www/ojialanshori
```

Buat juga user deploy (kalau belum) untuk SSH dari mesin lokal:

```bash
sudo adduser deploy
sudo usermod -aG www-data deploy
# Tambahkan public key SSH lokal Anda ke /home/deploy/.ssh/authorized_keys
# Beri akses sudo terbatas untuk restart service:
echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart ojialanshori, /bin/systemctl status ojialanshori' | sudo tee /etc/sudoers.d/deploy
```

### 2. Setup environment file

Copy `.env.production.example` ke VPS sebagai `/var/www/ojialanshori/shared/.env`, lalu isi:

```bash
sudo cp .env.production.example /var/www/ojialanshori/shared/.env
sudo chown www-data:www-data /var/www/ojialanshori/shared/.env
sudo chmod 600 /var/www/ojialanshori/shared/.env
sudo nano /var/www/ojialanshori/shared/.env
```

Generate session secret: `openssl rand -hex 32`

### 3. Buat database & jalankan migration

```bash
sudo mysql -u root <<'SQL'
CREATE DATABASE ojialanshori CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ojialanshori'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON ojialanshori.* TO 'ojialanshori'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Migration dijalankan dari mesin lokal yang punya akses ke `MYSQL_URL` VPS:

```bash
# Dari project root lokal:
MYSQL_URL=mysql://ojialanshori:PASS@VPS_IP:3306/ojialanshori pnpm db:migrate
```

(Atau temporarily expose MySQL port via SSH tunnel: `ssh -L 3307:localhost:3306 deploy@VPS`, lalu pakai `MYSQL_URL=mysql://...@127.0.0.1:3307/...`)

### 4. Install systemd service

```bash
# Dari mesin lokal — copy file service ke VPS:
scp deploy/ojialanshori.service deploy@VPS:/tmp/

# Di VPS:
sudo mv /tmp/ojialanshori.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ojialanshori
# Jangan start dulu — belum ada release.
```

### 5. Install Nginx config

```bash
# Dari lokal:
scp deploy/nginx.conf deploy@VPS:/tmp/

# Di VPS:
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/ojialanshori.conf

# Edit sementara: comment out semua block HTTPS + redirect, biarkan hanya server :80 yang proxy ke app.
# Ini diperlukan agar certbot HTTP-01 challenge bisa jalan.
sudo nano /etc/nginx/sites-available/ojialanshori.conf

sudo ln -s /etc/nginx/sites-available/ojialanshori.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Generate SSL certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d ojialanshori.com -d www.ojialanshori.com
# Setelah sukses, restore block HTTPS + redirect HTTP→HTTPS di nginx.conf:
sudo nano /etc/nginx/sites-available/ojialanshori.conf
sudo nginx -t && sudo systemctl reload nginx
```

## Deploy pertama & berikutnya

Dari mesin lokal, di project root:

```bash
# Sesuaikan default kalau perlu:
SSH_HOST=deploy@ojialanshori.com APP_DIR=/var/www/ojialanshori ./deploy/deploy.sh
```

Script akan:
1. Build `.output/` di lokal (`pnpm build`)
2. Rsync ke `/var/www/ojialanshori/releases/<timestamp>/.output/`
3. Install `sharp` di VPS (binary arch-specific)
4. Atomic-switch symlink `current` → release baru
5. Restart `ojialanshori.service`
6. Hapus release > 5 yang lama

## Verifikasi

```bash
# Status service
ssh deploy@VPS 'systemctl status ojialanshori'

# Logs
ssh deploy@VPS 'sudo journalctl -u ojialanshori -f --since "1 min ago"'

# Health check via local proxy
curl -I https://ojialanshori.com
```

## Troubleshooting

**Service gagal start dengan error sharp/binary mismatch:**
- Pastikan step "install sharp di VPS" di `deploy.sh` jalan tanpa error.
- Atau install manual: `ssh VPS 'cd /var/www/ojialanshori/current/.output/server && npm i sharp'`

**Nginx 502 Bad Gateway:**
- Cek service: `systemctl status ojialanshori`
- Cek port 3000 listening: `ss -tlnp | grep 3000`
- Cek logs: `journalctl -u ojialanshori -n 50`

**Image upload gagal:**
- Verifikasi `NUXT_R2_*` env vars di `/var/www/ojialanshori/shared/.env`
- Test akses R2 dari VPS: `curl -I $NUXT_R2_ENDPOINT`

**Migration belum jalan / schema mismatch:**
- Jalankan ulang dari lokal: `pnpm db:migrate` dengan `MYSQL_URL` ke VPS

## File-file di folder ini

- `ojialanshori.service` — systemd unit
- `nginx.conf` — server block Nginx (SSL + reverse proxy + static caching)
- `.env.production.example` — template env vars (jangan commit yang sudah terisi)
- `deploy.sh` — deploy script (build lokal → rsync → restart)
- `README.md` — dokumen ini
