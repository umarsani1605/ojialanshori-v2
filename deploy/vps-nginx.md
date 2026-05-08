# VPS Deployment

Panduan ini untuk deploy ke VPS biasa tanpa Docker. App tetap memakai Cloudflare untuk blob/image, tapi proses app-nya jalan di Node.js di belakang Nginx.

## Prasyarat

- Ubuntu/Debian VPS
- Node.js 20+ atau 22+
- `pnpm`
- `nginx`
- MySQL server yang bisa diakses dari VPS

## Environment

Siapkan `.env` di root project:

```bash
NODE_ENV=production
NUXT_PUBLIC_SITE_URL=https://ojialanshori.com
MYSQL_URL=mysql://user:pass@host:3306/db
NUXT_SESSION_SECRET=...
NUXT_PUBLIC_DISQUS_SHORTNAME=ojialanshori
BREVO_API_KEY=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

Kalau pakai prefiks `NUXT_`, itu juga valid. Aplikasi membaca keduanya.

## Build

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

Kalau build masih kena `heap out of memory`, naikkan limit Node atau tambahkan swap di VPS.

## Jalankan App

Hasil build ada di `.output/server/index.mjs`.

Contoh `systemd`:

```ini
[Unit]
Description=Omah Ngaji Nuxt App
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/omahngaji-v2
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
EnvironmentFile=/var/www/omahngaji-v2/.env
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Nginx

Contoh file `/etc/nginx/sites-available/ojialanshori.com`:

```nginx
server {
  listen 80;
  server_name ojialanshori.com www.ojialanshori.com;

  client_max_body_size 50m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Aktifkan lalu reload:

```bash
ln -s /etc/nginx/sites-available/ojialanshori.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Notes

- `nitro.preset` sudah diset ke `node-server` untuk VPS.
- Image/blob tetap ke Cloudflare.
- Kalau kamu tidak ingin dependensi Cloudflare untuk auth rate limit, bagian `kv` di backend masih perlu diganti dulu.
