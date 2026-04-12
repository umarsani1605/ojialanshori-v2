# Omah Ngaji Al-Anshori — Website v2

Rewrite website pesantren [ojialanshori.com](https://ojialanshori.com) dari WordPress ke Nuxt 4 fullstack.

## Tech Stack

- **Framework:** Nuxt 4 + Nuxt UI
- **Deployment:** Cloudflare Workers via NuxtHub
- **Database:** MySQL + Drizzle ORM
- **Storage:** Cloudflare R2
- **Cache/KV:** Cloudflare KV

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` dan isi semua variabel:

| Variable | Keterangan |
|---|---|
| `MYSQL_URL` | Koneksi MySQL: `mysql://user:pass@host:3306/db` |
| `NUXT_SESSION_SECRET` | Secret minimal 32 karakter untuk session |
| `BREVO_API_KEY` | API key Brevo untuk notifikasi email |
| `DISQUS_SHORTNAME` | Shortname Disqus (default: `ojialanshori`) |
| `NUXT_HUB_PROJECT_SECRET_KEY` | Secret key NuxtHub remote storage |
| `NUXT_HUB_CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `NUXT_HUB_CLOUDFLARE_API_TOKEN` | Cloudflare API Token |

### 3. Jalankan dev server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 4. Generate & migrate database

```bash
pnpm db:generate   # generate migration dari schema
pnpm db:migrate    # jalankan migration
```

## Deployment

Deploy ke Cloudflare Workers via NuxtHub:

```bash
pnpm build
```

## Migration dari WordPress

Script migrasi tersedia di folder `scripts/`:

```bash
npx tsx scripts/migrate-content.ts   # Posts, Pages, Categories
npx tsx scripts/migrate-users.ts     # Users & Password Hash
npx tsx scripts/migrate-media.ts     # Media ke Cloudflare R2
```

## Struktur Folder

```
├── app.vue
├── components/        # Vue components
├── composables/       # Composables
├── layouts/           # Layout templates
├── pages/             # Public pages
│   └── admin/         # Admin panel pages
├── public/            # Static assets
├── server/
│   ├── db/            # Drizzle schema & migrations
│   ├── middleware/    # Server middleware
│   └── utils/         # Server utilities
├── docs/
│   └── prd/           # PRD documents
└── scripts/           # Migration scripts
```
