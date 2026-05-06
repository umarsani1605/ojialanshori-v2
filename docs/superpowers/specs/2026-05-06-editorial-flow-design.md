# Editorial Content Flow — Design Spec
**Date:** 2026-05-06
**Project:** Omah Ngaji Al-Anshori (ojialanshori.com)

## Overview

Implementasi full editorial flow dari santri menulis hingga artikel dipublish oleh reviewer/admin. Mengikuti model WordPress-style: satu level review, siapapun dengan role `reviewer` atau `admin` bisa approve.

---

## Roles & Permissions

| Role | Akses Konten |
|---|---|
| `santri` | Buat, edit, submit artikel milik sendiri |
| `reviewer` | Review, approve, reject semua artikel pending |
| `admin` | Semua yang reviewer bisa + manajemen user & all-posts view |

---

## Status Flow

```
draft ──(submit)──► pending_review ──(approve)──► published
                          │
                          └──(reject)──► rejected ──(edit & resubmit)──► pending_review
```

Transisi yang valid:
- `santri`: `draft → pending_review` (submit), `rejected → pending_review` (resubmit)
- `reviewer`/`admin`: `pending_review → published` (approve), `pending_review → rejected` (reject)

---

## Section 1: Schema Changes

File: `server/db/schema.ts`

**Perubahan pada tabel `posts`:**

1. **Rename** `rejectionNote` → `reviewNote`, tipe `text` → `longtext`
   - Alasan: sekarang HTML rich text dari TipTap, bukan plain text
   - Data lama tetap valid (plain text adalah valid HTML)
2. **Tambah** `reviewedBy` — `int`, nullable, FK ke `users.id`
   - Track siapa reviewer terakhir yang approve/reject
   - Ditampilkan ke santri di halaman edit artikel

Shape akhir field yang relevan:
```typescript
status: mysqlEnum(['draft', 'pending_review', 'published', 'rejected'])
reviewNote: longtext | null       // ganti rejectionNote
reviewedBy: int (FK users) | null // BARU
publishedAt: timestamp | null     // sudah ada, diisi otomatis saat approve
```

Migration: rename column + change type, handle via `pnpm db:generate`.

---

## Section 2: API Endpoints (Baru)

### Reviewer / Admin — Review Queue

| Method | Route | Guard | Aksi |
|---|---|---|---|
| `GET` | `/api/dashboard/review/queue` | reviewer \| admin | List semua `pending_review` posts + author info |
| `GET` | `/api/dashboard/review/[id]` | reviewer \| admin | Detail satu post untuk halaman review |
| `POST` | `/api/dashboard/review/[id]/approve` | reviewer \| admin | Set `published`, isi `publishedAt` + `reviewedBy`, kirim email |
| `POST` | `/api/dashboard/review/[id]/reject` | reviewer \| admin | Set `rejected`, isi `reviewNote` + `reviewedBy`, kirim email. Body: `{ reviewNote: string }` (required) |

### Admin — All Posts View

| Method | Route | Guard | Aksi |
|---|---|---|---|
| `GET` | `/api/admin/posts` | admin | List semua post lintas penulis, query params: `?status=`, `?page=`, `?limit=` |

### Santri — Update Kecil

- `GET /api/dashboard/santri/posts/[id]` — tambahkan join ke `users` untuk return `reviewedBy` sebagai `{ id, name }` bukan hanya ID integer.

---

## Section 3: UI Pages

### 3a. Reviewer Queue — `/dashboard/review`

Saat ini placeholder. Akan diimplementasi menjadi:

- Tabel list artikel `pending_review`
- Kolom: Judul, Penulis (santri), Kategori, Tanggal submit
- Per-row action: tombol **Buka** → navigasi ke halaman detail review
- Empty state jika tidak ada artikel pending

### 3b. Detail Review — `/dashboard/review/[id]`

Layout dua-kolom mirip `SantriPostEditor`:
- **Main area (kiri):** Read-only preview artikel (judul, konten, featured image, kategori, tags)
- **Sidebar (kanan):**
  - Info artikel: penulis, tanggal submit, kategori
  - Section review notes: TipTap editor simplified (B/I/U/S, bullet list, numbering list, link)
  - Tombol **Tolak** (require reviewNote terisi) + **Publish** (reviewNote opsional)

Setelah approve/reject:
- Toast sukses
- Redirect kembali ke `/dashboard/review`
- Email terkirim ke santri

### 3c. Admin All Posts — `/admin/posts`

Saat ini placeholder. Akan diimplementasi menjadi:
- Tabel semua post lintas penulis
- Filter by status (tab atau dropdown)
- Kolom: Judul, Penulis, Status (badge), Kategori, Tanggal
- Admin bisa langsung approve/reject dari sini juga (action inline)
- Pagination

### 3d. Santri Post Editor — Update

Di `SantriPostEditor.vue`, saat status artikel `rejected`:
- Sidebar sudah menampilkan `rejectionNote` — ganti ke render HTML `reviewNote`
- Tambahkan nama reviewer: "Direview oleh: {reviewedBy.name}"

---

## Section 4: Email Notifications

Provider: **Brevo REST API** (sudah ada di stack).

### Email 1 — Artikel Dipublish (Approve)

- **Penerima:** email santri (author)
- **Subject:** `Artikel kamu telah dipublish — {judul artikel}`
- **Isi:** Nama santri, judul artikel, link ke artikel published di ojialanshori.com, nama reviewer

### Email 2 — Artikel Ditolak (Reject)

- **Penerima:** email santri (author)
- **Subject:** `Artikel kamu membutuhkan revisi — {judul artikel}`
- **Isi:** Nama santri, judul artikel, review note (render HTML), nama reviewer, link ke halaman edit

---

## Implementation Order (API first → UI)

### Fase 1: Schema & Migration
1. Update `schema.ts`: rename `rejectionNote` → `reviewNote` (longtext), tambah `reviewedBy`
2. Generate & apply migration

### Fase 2: Server API
3. `GET /api/dashboard/review/queue`
4. `GET /api/dashboard/review/[id]`
5. `POST /api/dashboard/review/[id]/approve` (+ email approve)
6. `POST /api/dashboard/review/[id]/reject` (+ email reject)
7. `GET /api/admin/posts`
8. Update `GET /api/dashboard/santri/posts/[id]` — join reviewedBy

### Fase 3: UI
9. `/dashboard/review` — reviewer queue list
10. `/dashboard/review/[id]` — detail review page + TipTap simplified editor
11. `/admin/posts` — admin all-posts view
12. Update `SantriPostEditor` — render reviewNote HTML + tampilkan reviewer name

---

## Constraints & Notes

- `reviewNote` hanya wajib saat reject, opsional saat approve
- Setelah resubmit, `reviewNote` lama di-clear (reset ke null)
- `publishedAt` diset ke `NOW()` saat approve
- `reviewedBy` selalu diupdate ke reviewer saat ini, baik approve maupun reject
- Antrian review bersifat shared — tidak ada assignment, siapapun bisa ambil
- TipTap simplified editor tools: Bold, Italic, Underline, Strikethrough, Bullet List, Ordered List, Link
