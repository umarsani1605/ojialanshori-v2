# Rename Post to Artikel UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti terminologi UI `Post` menjadi `Artikel` dan menstandarkan label status artikel ke istilah Indonesia tanpa mengubah nama variabel, fungsi, tipe, route, atau API.

**Architecture:** Perubahan dibatasi ke string literal frontend pada komponen Vue yang sudah ada. Tidak ada refactor perilaku, tidak ada perubahan data shape, dan tidak ada perubahan pada identifier teknis seperti `post`, `getPostStatusLabel`, atau path `/dashboard/posts`.

**Tech Stack:** Nuxt 4, Vue SFC, TypeScript, Nuxt UI

---

## Scope Guardrails

- Ubah hanya string literal yang dirender ke UI.
- Jangan ubah nama variabel, nama fungsi, interface/type, route path, query key, atau endpoint API.
- Pertahankan status teknis `draft`, `pending_review`, `published`, `rejected`; yang berubah hanya label tampilannya.
- Gunakan istilah final berikut untuk label status UI:
  - `published` -> `Terbit`
  - `pending_review` -> `Dalam Ulasan`
  - `draft` -> `Draft`
  - `rejected` -> `Ditolak`

## File Map

- Modify: `app/components/admin/AdminHomePage.vue`
  - Stat card admin, heading daftar review, empty state, dan badge pending review.
- Modify: `app/components/dashboard/DashboardHomePage.vue`
  - Copy dashboard santri/reviewer, alert, heading, empty state, dan label stat card.
- Modify: `app/components/dashboard/SantriPostEditor.vue`
  - Copy editor, placeholder, alt text, toast, dan computed `statusLabel`.
- Modify: `app/components/AppSidebar.vue`
  - Label navigasi admin.
- Modify: `app/layouts/dashboard-santri.vue`
  - Label navigasi santri dan CTA tulis artikel.
- Modify: `app/pages/admin/posts/index.vue`
  - Judul placeholder page admin posts.
- Modify: `app/pages/admin/review/index.vue`
  - Judul placeholder page admin review.
- Modify: `app/pages/dashboard/posts/index.vue`
  - Tab label, helper `getStatusLabel`, heading, empty state, modal delete, dan toast delete.

## Task 1: Ganti Terminologi UI `Post` -> `Artikel`

**Files:**
- Modify: `app/components/admin/AdminHomePage.vue`
- Modify: `app/components/dashboard/DashboardHomePage.vue`
- Modify: `app/components/dashboard/SantriPostEditor.vue`
- Modify: `app/components/AppSidebar.vue`
- Modify: `app/layouts/dashboard-santri.vue`
- Modify: `app/pages/admin/posts/index.vue`
- Modify: `app/pages/admin/review/index.vue`
- Modify: `app/pages/dashboard/posts/index.vue`

- [ ] Ubah semua label, heading, CTA, placeholder, empty state, modal title, dan toast yang masih memakai kata `Post` menjadi `Artikel`.
- [ ] Terapkan wording final berikut pada titik yang sudah diverifikasi di repo:
  - `Post Terpublikasi` -> `Artikel Terbit`
  - `Post Menunggu Review` -> `Artikel Dalam Ulasan`
  - `Tidak ada post yang menunggu review.` -> `Tidak ada artikel yang menunggu review.`
  - `Total Post` -> `Total Artikel`
  - `Tulis Post` -> `Tulis Artikel`
  - `Post Saya` -> `Artikel Saya`
  - `Belum ada post yang ditulis.` -> `Belum ada artikel yang ditulis.`
  - `Belum ada post.` -> `Belum ada artikel.`
  - `Review Post` -> `Review Artikel`
  - `Semua Post` -> `Semua Artikel`
  - `Post sedang direview` -> `Artikel sedang direview`
  - `Post yang berstatus menunggu review tidak bisa diedit.` -> `Artikel yang berstatus menunggu review tidak bisa diedit.`
  - `Post dikirim untuk review` -> `Artikel dikirim untuk review`
  - `Post diperbarui` -> `Artikel diperbarui`
  - `Edit Post` -> `Edit Artikel`
  - `Tulis Post Baru` -> `Tulis Artikel Baru`
  - `Judul post kamu...` -> `Judul artikel kamu...`
  - `Mulai menulis isi post kamu...` -> `Mulai menulis isi artikel kamu...`
  - `Preview cover post` -> `Preview cover artikel`
  - `Post '...' sudah disetujui` -> `Artikel '...' sudah disetujui`
  - `Post tersebut sudah masuk ke listing publik.` -> `Artikel tersebut sudah masuk ke listing publik.`
  - `${n} post perlu diperbaiki` -> `${n} artikel perlu diperbaiki`
  - `Buka daftar post untuk melihat catatan reviewer.` -> `Buka daftar artikel untuk melihat catatan reviewer.`
  - `Hapus Post?` -> `Hapus Artikel?`
  - `Post dihapus` -> `Artikel dihapus`
  - `Gagal menghapus post` -> `Gagal menghapus artikel`

## Task 2: Standarisasi Label Status UI

**Files:**
- Modify: `app/components/admin/AdminHomePage.vue`
- Modify: `app/components/dashboard/DashboardHomePage.vue`
- Modify: `app/components/dashboard/SantriPostEditor.vue`
- Modify: `app/pages/dashboard/posts/index.vue`

- [ ] Ubah semua label status yang tampil ke pengguna agar memakai istilah final Indonesia.
- [ ] Update mapping label di helper/computed tanpa mengganti nama fungsi atau key status:
  - `getPostStatusLabel()` di `app/components/dashboard/DashboardHomePage.vue`
    - `Published` -> `Terbit`
    - `Pending Review` -> `Dalam Ulasan`
    - `Rejected` dan `Draft` tetap seperti existing kecuali memang sudah sesuai target.
  - `statusLabel` di `app/components/dashboard/SantriPostEditor.vue`
    - `Terpublikasi` -> `Terbit`
    - `Menunggu Review` -> `Dalam Ulasan`
  - `getStatusLabel()` di `app/pages/dashboard/posts/index.vue`
    - `Published` -> `Terbit`
    - `Pending Review` -> `Dalam Ulasan`
    - `Rejected` dan `Draft` tidak diubah.
- [ ] Sinkronkan semua label stat card, tab, dan badge yang masih memakai istilah lama:
  - `Terpublikasi` -> `Terbit`
  - `Menunggu Review` -> `Dalam Ulasan`
  - `Published` tab -> `Terbit`
  - `Pending Review` tab -> `Dalam Ulasan`

## Task 3: Verifikasi Scope dan Regression Check

**Files:**
- Verify only, no new files expected

- [ ] Jalankan pencarian literal untuk memastikan tidak ada string target yang tertinggal di file scope:
  - `rg -n "Post|Terpublikasi|Menunggu Review|Published|Pending Review" app/components/admin/AdminHomePage.vue app/components/dashboard/DashboardHomePage.vue app/components/dashboard/SantriPostEditor.vue app/components/AppSidebar.vue app/layouts/dashboard-santri.vue app/pages/admin/posts/index.vue app/pages/admin/review/index.vue app/pages/dashboard/posts/index.vue`
- [ ] Review hasil `rg` dan pastikan sisa match yang tertinggal hanya identifier teknis atau string yang memang sengaja dipertahankan.
- [ ] Jalankan pengecekan statis minimal:
  - `pnpm test -- --runInBand`
  - Jika suite global terlalu luas atau tidak relevan, fallback ke `pnpm exec vitest run` dan catat hasilnya.
- [ ] Jalankan verifikasi manual di `pnpm dev` untuk halaman berikut:
  - `/dashboard`
  - `/dashboard/posts`
  - `/dashboard/posts/create`
  - `/admin`
  - `/admin/posts`
  - `/admin/review`
- [ ] Cek khusus elemen berikut:
  - Sidebar admin menampilkan `Review Artikel` dan `Semua Artikel`
  - Layout santri menampilkan `Artikel Saya` dan tombol `Tulis Artikel`
  - Dashboard santri menampilkan `Total Artikel`, `Terbit`, dan `Dalam Ulasan`
  - Editor santri menampilkan placeholder baru dan toast baru
  - Daftar artikel santri menampilkan tab `Terbit` dan `Dalam Ulasan`
  - Modal hapus menampilkan `Hapus Artikel?` dan toast hapus memakai istilah `Artikel`

## Notes

- Di `app/pages/dashboard/posts/index.vue`, tombol CTA header sudah bertuliskan `Tulis Artikel`; tidak perlu perubahan tambahan di titik itu.
- Perubahan `Artikel Terbit` dan `Artikel Dalam Ulasan` di admin home adalah hasil gabungan rename terminologi + standardisasi label status, dan harus diperlakukan sebagai wording final.

## Self-Review

- Spec coverage: semua file yang disebut user sudah terpetakan, termasuk helper status dan label navigasi.
- Placeholder scan: tidak ada `TODO` atau langkah generik; semua wording final sudah dituliskan eksplisit.
- Type consistency: seluruh nama teknis seperti `post`, `pending_review`, `getPostStatusLabel`, dan route `/dashboard/posts` tetap dipertahankan.
