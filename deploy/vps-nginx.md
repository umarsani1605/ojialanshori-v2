# Deploy ke VPS dengan aaPanel

Panduan deploy Omah Ngaji Al-Anshori (Nuxt 4 + Node SSR) menggunakan aaPanel.

## Overview

aaPanel menangani Node.js via PM2, Nginx via GUI, dan SSL via Let's Encrypt — tidak perlu setup systemd manual.

Flow deploy:
1. Build `.output/` di lokal
2. Rsync ke VPS
3. PM2 auto-restart via `deploy.sh`

---

## Setup Awal di VPS (sekali saja)

### 1. Install Node.js di aaPanel

**aaPanel > App Store > Runtime** → install **Node.js** versi 20.x (atau 22.x).

### 2. Buat direktori project

Di terminal VPS atau via aaPanel File Manager:

```bash
mkdir -p /www/wwwroot/ojialanshori
```

### 3. Buat database MySQL

**aaPanel > Database > Add Database:**
- Database name: `ojialanshori`
- Username: `ojialanshori`
- Password: (generate kuat)
- Access: `127.0.0.1`

Catat credentials untuk `.env`.

### 4. Siapkan environment file

Di VPS, buat file `/www/wwwroot/ojialanshori/.env`:

```bash
nano /www/wwwroot/ojialanshori/.env
```

Isi berdasarkan `deploy/.env.production.example` — ganti semua `USER`, `PASSWORD`, dll:

```env
NUXT_MYSQL_URL=mysql://ojialanshori:PASSWORD@127.0.0.1:3306/ojialanshori
NUXT_SESSION_SECRET=<output dari: openssl rand -hex 32>
NUXT_BREVO_API_KEY=...
NUXT_R2_ACCESS_KEY_ID=...
NUXT_R2_SECRET_ACCESS_KEY=...
NUXT_R2_BUCKET=ojialanshori
NUXT_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
NUXT_PUBLIC_SITE_URL=https://ojialanshori.com
NUXT_PUBLIC_DISQUS_SHORTNAME=...
```

Amankan file:

```bash
chmod 600 /www/wwwroot/ojialanshori/.env
```

### 5. Deploy pertama kali (upload .output/)

Dari mesin lokal di project root:

```bash
./deploy/deploy.sh
```

Script akan build dan rsync `.output/` ke `/www/wwwroot/ojialanshori/.output/`.

Untuk deploy pertama, PM2 belum ada — lanjut ke step berikutnya dulu.

### 6. Tambahkan Node Project di aaPanel

**aaPanel > Node Projects > Add:**

| Field | Value |
|-------|-------|
| Project path | `/www/wwwroot/ojialanshori` |
| Startup file | `.output/server/index.mjs` |
| Node version | 20.x |
| Port | `3000` |
| PM2 mode | `fork` |

Setelah project ditambahkan, aaPanel otomatis jalankan via PM2 dengan nama project (default = nama folder).

**Set environment variables:** Klik project → **Environment** → tambahkan semua `NUXT_*` vars dari `.env`.

> Atau, set `NODE_ENV=production` + biarkan app baca `.env` langsung. Pastikan startup file `index.mjs` membaca `process.env`.

Catat **PM2 app name** (biasanya = nama folder: `ojialanshori`) — sesuaikan `PM2_APP` di `deploy.sh` kalau berbeda.

### 7. Tambahkan Website (Nginx + SSL)

**aaPanel > Website > Add Site:**

| Field | Value |
|-------|-------|
| Domain | `ojialanshori.com` |
| Additional domains | `www.ojialanshori.com` |
| PHP | pure static / no PHP |
| Root | `/www/wwwroot/ojialanshori` |

**Aktifkan SSL:** Site → **SSL** → Let's Encrypt → centang domain → Apply.

**Konfigurasi Reverse Proxy:** Site → **Proxy** → Add:

| Field | Value |
|-------|-------|
| Name | `nuxt-app` |
| Target URL | `http://127.0.0.1:3000` |
| Send domain | aktif |

Atau edit Nginx config langsung (Site → **Config**) dan tambahkan:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

### 8. Jalankan database migration

Dari mesin lokal (butuh akses ke MySQL VPS):

```bash
# Via SSH tunnel (aman, tidak expose port MySQL ke publik):
ssh -L 3307:127.0.0.1:3306 root@ojialanshori.com -N &
MYSQL_URL=mysql://ojialanshori:PASSWORD@127.0.0.1:3307/ojialanshori pnpm db:migrate
kill %1
```

---

## Deploy Berikutnya

```bash
# Dari project root lokal:
./deploy/deploy.sh
```

Script: build lokal → rsync → install sharp → `pm2 restart ojialanshori`.

### Override SSH host / path

```bash
SSH_HOST=root@ojialanshori.com APP_DIR=/www/wwwroot/ojialanshori PM2_APP=ojialanshori ./deploy/deploy.sh
```

---

## Verifikasi

```bash
# Status PM2
ssh root@ojialanshori.com 'pm2 status'

# Logs realtime
ssh root@ojialanshori.com 'pm2 logs ojialanshori --lines 30'

# Test endpoint
curl -I https://ojialanshori.com
```

---

## Troubleshooting

**PM2 tidak bisa restart (app name salah):**

```bash
ssh VPS 'pm2 list'  # lihat nama app yang terdaftar
# Sesuaikan PM2_APP di deploy.sh
```

**502 Bad Gateway:**

```bash
ssh VPS 'pm2 status'         # pastikan app running
ssh VPS 'ss -tlnp | grep 3000'  # pastikan port 3000 listen
ssh VPS 'pm2 logs ojialanshori --lines 50'  # cek error
```

**Sharp error (binary mismatch):**

```bash
ssh VPS 'cd /www/wwwroot/ojialanshori/.output/server && npm install sharp'
ssh VPS 'pm2 restart ojialanshori'
```

**Image upload gagal:**
- Verifikasi `NUXT_R2_*` vars sudah di-set di aaPanel Node Project > Environment
- Test: `curl -I $NUXT_R2_ENDPOINT`

**Migration belum jalan / kolom tidak ada:**

```bash
# Dari lokal via SSH tunnel:
ssh -L 3307:127.0.0.1:3306 root@ojialanshori.com -N &
MYSQL_URL=mysql://ojialanshori:PASS@127.0.0.1:3307/ojialanshori pnpm db:migrate
kill %1
```

---

## File-file di folder ini

- `deploy.sh` — deploy script (build lokal → rsync → pm2 restart)
- `.env.production.example` — template env vars
- `nginx.conf` — referensi Nginx config (untuk setup manual non-aaPanel)
