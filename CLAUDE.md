# CLAUDE.md

## Project Context

**Project:** Omah Ngaji Al-Anshori — Website Rewrite (ojialanshori.com)
**Deskripsi:** Full rewrite website pesantren dari WordPress ke Nuxt 4 fullstack.

### Tech Stack

| Layer | Teknologi |
| --- | --- |
| Framework | Nuxt 4 + Nuxt UI |
| Deployment | Cloudflare Workers via NuxtHub |
| Database | MySQL + Drizzle ORM |
| Storage | Cloudflare R2 (via NuxtHub blob) |
| Cache/KV | Cloudflare KV (via NuxtHub) |
| Auth | nuxt-auth-utils |
| Email | Brevo REST API |

### Konvensi Kode

- TypeScript — hindari `any`
- camelCase di TypeScript, snake_case di DB (via `casing: 'snake_case'` di hub config)
- Server routes di `server/api/` dan `server/routes/`
- Drizzle ORM untuk semua query DB — tidak ada raw SQL kecuali terpaksa
- Schema di `server/db/schema.ts`, jangan tulis migration manual

---

## Akses Dokumentasi — WAJIB Sebelum Implementasi

Nuxt, Nuxt UI, dan NuxtHub memiliki banyak perubahan yang tidak tercakup oleh training data. **Selalu baca dokumentasi terbaru** sebelum mengimplementasikan apapun yang menyentuh ketiga library ini.

### Cara akses dokumentasi

| Library     | Cara Akses                                                          | Tools                                                                                                                   |
| ----------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Nuxt**    | MCP tersedia                                                        | `mcp__nuxt__get-documentation-page`, `mcp__nuxt__list-documentation-pages`, `mcp__nuxt__get-getting-started-guide`, dll |
| **Nuxt UI** | MCP tersedia                                                        | `mcp__nuxt-ui__get-component`, `mcp__nuxt-ui__get-documentation-page`, `mcp__nuxt-ui__list-components`, dll             |
| **NuxtHub** | Tidak ada MCP — gunakan mcp context7 jika tersedia, atau web search | `WebSearch` atau `WebFetch` ke `hub.nuxt.com`                                                                           |

### Kapan harus akses dokumentasi

- Sebelum menulis atau mengubah konfigurasi `nuxt.config.ts`
- Sebelum menggunakan composable, component, atau API baru dari Nuxt / Nuxt UI
- Sebelum setup atau konfigurasi NuxtHub (`hub.*`, `hubBlob()`, `hubDatabase()`, dll)
- Sebelum menggunakan Nuxt UI components (`UButton`, `UForm`, `UTable`, dll)
- Kapanpun ada error yang berhubungan dengan salah satu dari ketiga library ini

### Jangan berasumsi — selalu verifikasi ke docs

Training data sudah outdated untuk ketiga library ini. Jika ragu tentang API, nama prop, cara konfigurasi, atau cara penggunaan — cari di docs terlebih dahulu sebelum menulis kode.

---

## Database Instructions

- **Dialect:** MySQL via NuxtHub (`hub.db: { dialect: 'mysql' }`)
- **Schema:** `server/db/schema.ts` — definisi tabel dengan `mysqlTable` dari `drizzle-orm/mysql-core`
- **Casing:** `casing: 'snake_case'` aktif — tulis camelCase di TypeScript, otomatis jadi snake_case di DB
- **Generate migration:** `pnpm db:generate` (jalankan setelah ubah schema)
- **Apply migration:** `pnpm db:migrate` (butuh `MYSQL_URL` di `.env`)
- **JANGAN tulis file migration SQL manual** — selalu generate via `pnpm db:generate`
- **Paginasi:** SELALU gunakan `.limit()` dan `.offset()` untuk kueri data berjumlah besar. Cloudflare Workers memiliki batas CPU (10ms-50ms) — mengambil terlalu banyak data sekaligus dapat menyebabkan lonjakan memori dan `Worker exceeded CPU limit`.
- Migration files ada di `server/db/migrations/mysql/`

---

## Linear Workflow

### Sebelum mulai ticket

1. Pull ticket dari Linear: gunakan `mcp__linear-omah-ngaji__get_issue` dengan issue ID
2. Baca komentar ticket sebelumnya (misal mulai OJI-3, baca komentar OJI-2) via `mcp__linear-omah-ngaji__list_comments` — cari handoff notes dari agent sebelumnya
3. Baca full description, acceptance criteria, dan technical notes
4. Set status ticket ke **In Progress** via `mcp__linear-omah-ngaji__save_issue`

### Branch naming

- Selalu buat branch baru sebelum mulai implementasi
- Format: `{gitBranchName dari Linear ticket}`
  - Contoh: `umarsani361/oji-2-e1-002-drizzle-orm-schema`, `umarsani361/oji-4-e1-004-migration-users`
- Jika ticket **bergantung pada** ticket sebelumnya yang belum di-merge, branch dari branch ticket itu
  - Cek field "Blocked by" di Linear untuk menentukan parent branch
- Jika tidak, selalu branch dari `main`

### Commit

Setelah implementasi selesai:

- Gunakan **atomic commits** — group file yang terkait dalam satu commit
- Ikuti format **Conventional Commits**:
  - `feat(scope): description` — fitur baru
  - `fix(scope): description` — bug fix
  - `refactor(scope): description` — restruktur tanpa perubahan behavior
  - `chore(scope): description` — tooling, deps, config
  - `docs(scope): description` — dokumentasi saja
- Scope opsional tapi dianjurkan (misal `feat(auth): add login endpoint`)
- Pesan commit: describe _apa_ yang berubah dan _kenapa_, bukan _bagaimana_

### Saat mengerjakan

- Tambahkan implementation notes sebagai komentar via `mcp__linear-omah-ngaji__save_comment`
- Jika ada blocker, tambah komentar dengan detail blocker dan biarkan status In Progress

### Setelah selesai

1. Post completion comment dengan struktur ini:

   **What was built**
   - {Bullet list fitur/endpoint/halaman yang diimplementasi}

   **Key files changed**
   - `{file path}` — {apa yang berubah}

   **Handoff notes**
   - {Context yang dibutuhkan ticket berikutnya}
   - {Deviasi dari spec original dan alasannya}

   > Wrap semua referensi kode dalam backtick: enum values, field names, function names, file paths, CLI commands.

2. Set status ke **In Review** (butuh review manusia) atau **Done** (self-contained + tests pass)
3. Buat atomic commits sesuai Conventional Commits
4. Push branch dan buka GitHub PR ke `main` (lihat section "GitHub Workflow")
5. Post PR URL sebagai komentar follow-up di ticket Linear

### Mencari ticket berikutnya

- Kerjakan sesuai epic dependency order: **E1 → E2 → E3/E4/E5/E6 (paralel) → E7 → E8**
- Dalam satu epic, kerjakan ticket secara numerik kecuali ada yang sudah unblocked lebih awal
- Gunakan `mcp__linear-omah-ngaji__list_issues` filter project + status=Todo untuk cari ticket berikutnya
- Pull full ticket dengan `mcp__linear-omah-ngaji__get_issue` sebelum mulai — jangan dari ingatan

### Status meanings

| Status      | Arti                                                  |
| ----------- | ----------------------------------------------------- |
| Backlog     | Belum dijadwalkan                                     |
| Todo        | Dijadwalkan untuk dikerjakan                          |
| In Progress | Sedang dikerjakan                                     |
| In Review   | Selesai dibangun, menunggu review / testing           |
| Done        | Terverifikasi selesai — semua AC dicek, tests passed  |
| Canceled    | Descoped atau tidak diperlukan                        |

---

## GitHub Workflow

### Membuat PR

Setelah semua commit di-push, buka GitHub PR targeting `main`:

**Format judul:** `[{TICKET-ID}] {ticket title}`

- Contoh: `[OJI-2] E1-002 — Drizzle ORM schema semua tabel MySQL`

**Format deskripsi PR:**

```
## Overview
{1–2 kalimat yang menjelaskan apa yang dilakukan PR ini dan kenapa}

- {Bullet detail penting, keputusan, atau scope}

## Changes
- `{file atau area}` — {apa yang berubah}
- ...

## Testing
- {Langkah-langkah untuk verifikasi perubahan bekerja}
- {Sertakan env vars atau setup yang dibutuhkan}

## Notes
{Opsional: deviasi dari spec, caveat, atau hal yang perlu diketahui reviewer.
Hilangkan section ini jika tidak ada yang perlu dicatat.}

## Linear
{URL ticket Linear}
```

- Setelah PR dibuat, post URL-nya sebagai **komentar terpisah** di ticket Linear
- Gunakan `mcp__linear-omah-ngaji__save_comment` dengan PR URL dan satu baris ringkasan
