# Handoff Notes: Berita & Pena Santri Separation

**Date:** 2026-05-07  
**Project:** omahngaji-v2 (`/Users/umarsani/Projects/omahngaji-v2`)  
**Branch:** `main`  
**Plan file:** `/Users/umarsani/.claude/plans/noble-fluttering-acorn.md`

---

## Konteks Pekerjaan

Sedang dalam proses **memisahkan halaman admin artikel menjadi dua area terpisah**:

1. **`/admin/berita`** — Berita, hanya admin yang menulis, langsung publish (tidak ada review queue), category selector disembunyikan (auto-assign ke satu kategori berita), tidak ada kolom penulis
2. **`/admin/pena-santri`** — Artikel santri, melalui review queue, reviewer bisa Tolak/Publish untuk post milik orang lain

Sebelumnya (Phase 1, sudah selesai di sesi-sesi sebelumnya), kita sudah:
- Refactor `SantriPostEditor.vue` jadi shared `PostEditor.vue` + `usePostEditor.ts` composable
- Hapus halaman review terpisah, gabungkan ke posts table dengan tombol Edit
- Hapus nav "Review Artikel" dari sidebar
- Admin/reviewer publish post milik sendiri langsung (bypass review queue) via `/api/admin/posts/[id]/publish`

---

## Arsitektur Kunci

### `usePostEditor.ts` composable
File: `app/composables/usePostEditor.ts`

Parameter: `opts: { postId?: number; postType?: 'berita' | 'pena_santri' }`

Key computed:
```ts
// Auto-detect dari category post jika postType tidak dipass sebagai prop
const effectivePostType = computed(() =>
  opts.postType ?? postData.value?.category?.type ?? undefined
)

// Admin menulis/edit berita (Simpan Draft + Publish)
const showBeritaActions = computed(
  () => auth.canReview.value && effectivePostType.value === 'berita'
)

// Reviewer mereview post pena_santri milik orang lain (Tolak + Publish)
const showReviewActions = computed(
  () => auth.canReview.value && !!postId && !isOwnPost.value && effectivePostType.value === 'pena_santri'
)
```

### Button states di PostEditor.vue (3 mode)
| Kondisi | Tombol |
|---|---|
| `showReviewActions` | Tolak + Publish |
| `showBeritaActions` | Simpan Draft + Publish |
| default (santri / own pena_santri) | Simpan Draft + Kirim Artikel |

### Category filtering
- `effectivePostType === 'berita'` → filter ke `type === 'berita'`, auto-assign ke `form.categoryId`, selector hidden
- `effectivePostType === 'pena_santri'` → filter ke `type === 'pena_santri'`, selector visible
- `canSubmit` untuk berita: hanya `featuredImage` (category sudah auto-assign)

### saveDraft() fix (admin create new post)
Bug lama: `canReview && !postId` fallthrough ke santri endpoint → 403  
Fix baru: ada branch `auth.canReview.value && !postId` → `POST /api/admin/posts`

### Redirect setelah create
- Berita baru → `/admin/berita/{id}/edit`
- Pena Santri baru → `/admin/pena-santri/{id}/edit`
- Santri → `/dashboard/posts/{id}/edit`

### approve() / reject() redirect
- Sekarang navigasi ke `/admin/pena-santri` (bukan `/admin/posts` lama)

---

## Status: Sudah Selesai (session ini)

### Backend
- [x] `server/api/admin/posts/index.post.ts` — **BARU, BELUM DI-COMMIT**
  - `requireReviewer`, insert post baru dengan `authorId = user.id`, `status = 'draft'`
  - Import `generateUniquePostSlug`, `syncPostTags`, `assertDraftPayload` dari `#server/utils/santriPostEditor`

### Frontend — Composable
- [x] `app/composables/usePostEditor.ts` — **MODIFIED, BELUM DI-COMMIT**
  - Tambah `postType` param
  - `effectivePostType` computed
  - Category filtering by effectivePostType
  - Auto-assign berita category watcher (watch `[categoriesRaw, effectivePostType]`)
  - `canSubmit` updated (berita: hanya featuredImage)
  - `showBeritaActions` computed
  - `showReviewActions` updated (tambah `&& effectivePostType === 'pena_santri'`)
  - Fix `saveDraft()` untuk `canReview && !postId` → `POST /api/admin/posts`
  - `sendPost()` untuk `canReview`: create draft dulu jika belum ada postId, lalu publish; redirect ke `/admin/berita` atau `/admin/pena-santri`
  - `approve()` / `reject()` redirect ke `/admin/pena-santri`
  - Return tambahan: `showBeritaActions`, `effectivePostType`

### Frontend — Components
- [x] `app/components/PostEditor.vue` — **MODIFIED, BELUM DI-COMMIT**
  - Tambah prop `postType?: 'berita' | 'pena_santri'`
  - Pass ke composable: `usePostEditor({ postId: props.postId, postType: props.postType })`
  - Destructure `showBeritaActions`, `effectivePostType`
  - Tombol aksi: 3 state (showReviewActions → Tolak+Publish, showBeritaActions → Simpan Draft+Publish, default → Simpan Draft+Kirim Artikel)
  - Category selector: `v-if="effectivePostType !== 'berita'"`
  - `backTo`: pena_santri atau showReviewActions → `/admin/pena-santri`, berita atau showBeritaActions → `/admin/berita`, default → `/dashboard/posts`

### Frontend — Layout
- [x] `app/layouts/admin.vue` — **MODIFIED, BELUM DI-COMMIT**
  - Ganti "Artikel" (→ `/admin/posts`) dengan dua item:
    - "Berita" icon `i-ph-newspaper-duotone` → `/admin/berita`
    - "Pena Santri" icon `i-ph-pen-nib-duotone` → `/admin/pena-santri`

---

## Status: BELUM Selesai (perlu dikerjakan)

### 1. Halaman Berita — `app/pages/admin/berita/`

**`app/pages/admin/berita/index.vue`** (BUAT BARU)
```vue
<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Berita",
});
```
- `useLazyFetch("/api/admin/posts")` — fetch semua post
- Filter client-side: `posts.filter(p => p.category?.type === 'berita')`
- Filter tambahan: `UInput` search (by title) + `USelect` status
- **TIDAK ADA kolom author** (berbeda dari pena-santri)
- Kolom: Judul, Status (badge), Kategori (kalau mau), Diperbarui, Aksi (edit + trash)
- Edit button → `/admin/berita/${id}/edit`
- Delete modal sama seperti `posts/index.vue`
- Header right: `UButton` "Tulis Berita" → `/admin/berita/create`
- Pagination client-side, PAGE_SIZE = 10

**`app/pages/admin/berita/create.vue`** (BUAT BARU)
```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Tulis Berita",
});
</script>
<template><PostEditor post-type="berita" /></template>
```

**`app/pages/admin/berita/[id]/edit.vue`** (BUAT BARU)
```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Edit Berita",
});
const route = useRoute();
const postId = Number(route.params.id);
</script>
<template><PostEditor :post-id="postId" post-type="berita" /></template>
```

---

### 2. Halaman Pena Santri — `app/pages/admin/pena-santri/`

**`app/pages/admin/pena-santri/index.vue`** (BUAT BARU)
```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "reviewer",  // reviewer juga bisa akses
  navbarTitle: "Pena Santri",
});
```
- `useLazyFetch("/api/admin/posts")` — fetch semua post
- Filter client-side: `posts.filter(p => p.category?.type === 'pena_santri' || !p.category)`
- Filter tambahan:
  - `UInput` search (by title)
  - `USelect` author — derived: `Array.from(new Map(posts.map(p => [p.author.id, p.author.name])).entries()).map(([id, name]) => ({ label: name, value: id }))`
  - `USelect` kategori — dari posts yang sudah difilter
  - `USelect` status
- **Ada kolom author** (berbeda dari berita)
- Kolom: Judul, Penulis, Status (badge), Kategori, Diperbarui, Aksi (edit + trash)
- Edit button → `/admin/pena-santri/${id}/edit`
- Delete modal sama
- Header right: `UButton` "Tulis Artikel" → `/admin/pena-santri/create` (opsional, kalau admin juga bisa nulis pena santri — tanyakan ke user)
- Pagination client-side, PAGE_SIZE = 10

**`app/pages/admin/pena-santri/create.vue`** (BUAT BARU, tanyakan dulu ke user apakah perlu — admin mungkin tidak perlu nulis pena_santri)
```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "reviewer",
  navbarTitle: "Tulis Artikel",
});
</script>
<template><PostEditor post-type="pena_santri" /></template>
```

**`app/pages/admin/pena-santri/[id]/edit.vue`** (BUAT BARU)
```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "reviewer",
  navbarTitle: "Edit Artikel",
});
const route = useRoute();
const postId = Number(route.params.id);
</script>
<template><PostEditor :post-id="postId" post-type="pena_santri" /></template>
```

---

### 3. Update `app/pages/admin/posts/index.vue` (OPTIONAL)

Edit button di halaman ini perlu update routing by category type:
```ts
to: row.original.category?.type === 'berita'
  ? `/admin/berita/${row.original.id}/edit`
  : `/admin/pena-santri/${row.original.id}/edit`
```
Halaman `/admin/posts` masih bisa dipertahankan sebagai all-posts fallback atau dihapus nanti.

---

### 4. Update `server/api/admin/posts/[id].get.ts` (CEK DULU)

Endpoint GET single post untuk admin harus return field `category` dengan `type`. Cek apakah sudah ada field `category: { id, name, type }` dalam response. Ini dibutuhkan agar `effectivePostType` bisa auto-detect dari `postData.value?.category?.type` ketika reviewer membuka post dari queue tanpa prop `postType`.

File: `server/api/admin/posts/[id].get.ts`

---

## File-file Terkait yang Perlu Diketahui

| File | Status | Keterangan |
|---|---|---|
| `app/composables/usePostEditor.ts` | Modified (uncommitted) | Core logic, sudah di-update lengkap |
| `app/components/PostEditor.vue` | Modified (uncommitted) | Template shared, sudah di-update |
| `app/layouts/admin.vue` | Modified (uncommitted) | Nav sudah diupdate, Berita + Pena Santri |
| `server/api/admin/posts/index.post.ts` | New (uncommitted) | Admin create post endpoint |
| `server/api/admin/posts/[id].get.ts` | Existing | Perlu verifikasi return `category.type` |
| `server/api/admin/posts/[id].patch.ts` | Existing | Admin PATCH own post |
| `server/api/admin/posts/[id]/publish.post.ts` | Existing | Admin publish own post |
| `server/api/admin/posts.get.ts` | Existing | Returns all posts `{ data: posts[] }` |
| `server/api/dashboard/review/[id]/approve.post.ts` | Existing | Approve dengan content body |
| `server/api/dashboard/review/[id]/reject.post.ts` | Existing | Reject dengan content + reviewNote |
| `server/utils/santriPostEditor.ts` | Existing | `slugify`, `generateUniquePostSlug`, `syncPostTags` |
| `server/utils/guard.ts` | Existing | `requireReviewer`, `requireAdmin`, `requireRole` |
| `server/utils/validation.ts` | Existing | `validateSantriPostBody`, `validateRouteIdParams` |
| `app/components/ReviewNoteEditor.vue` | Existing | UCard + UEditor untuk catatan reviewer |
| `app/pages/admin/posts/index.vue` | Existing | All-posts, perlu update edit button routing |

---

## Catatan Teknis Penting

1. **Glob zsh issue**: Jangan gunakan `rm` atau `git add` dengan path yang mengandung `[id]` tanpa quote. Selalu quote: `git add "server/api/admin/posts/[id].patch.ts"` atau gunakan full path dalam single quotes.

2. **`requiredRole` di pages**: Middleware `role` membaca `route.meta.requiredRole`. Values yang valid: `"admin"`, `"reviewer"`, `"santri"`. Untuk berita pakai `"admin"`, untuk pena-santri pakai `"reviewer"` (mencakup admin + reviewer).

3. **`useLazyFetch` vs `useAsyncData`**: Halaman list pakai `useLazyFetch` langsung. Post editor pakai `useAsyncData` dengan `lazy: true` di dalam composable.

4. **Type `AdminPost`**: Di halaman list, tipe ini perlu include `category: { id: number; name: string; type: 'berita' | 'pena_santri' } | null` agar filter client-side bisa berjalan.

5. **Semua perubahan di session ini BELUM di-commit**. Commit setelah semua halaman baru selesai dibuat.

---

## Urutan Pengerjaan yang Direkomendasikan

1. Verifikasi `server/api/admin/posts/[id].get.ts` return `category.type` ✓
2. Buat `app/pages/admin/berita/index.vue`
3. Buat `app/pages/admin/berita/create.vue`
4. Buat `app/pages/admin/berita/[id]/edit.vue`
5. Buat `app/pages/admin/pena-santri/index.vue`
6. Buat `app/pages/admin/pena-santri/create.vue` (tanyakan dulu ke user apakah perlu)
7. Buat `app/pages/admin/pena-santri/[id]/edit.vue`
8. Update edit button routing di `app/pages/admin/posts/index.vue`
9. Commit semua perubahan dengan pesan conventional commits

---

## Verifikasi Akhir

Setelah semua selesai, cek:
1. `/admin/berita` → list hanya berita, tidak ada kolom penulis, tombol "Tulis Berita"
2. `/admin/berita/create` → PostEditor tanpa category selector, tombol "Simpan Draft" + "Publish"
3. Publish berita baru → langsung published, redirect ke `/admin/berita`
4. `/admin/pena-santri` → list pena_santri, ada kolom penulis, filter author/kategori/status
5. `/admin/pena-santri/[id]/edit` untuk post `pending_review` → ReviewNoteEditor tampil, tombol "Tolak" + "Publish"
6. `/admin/pena-santri/[id]/edit` untuk post milik sendiri → "Simpan Draft" + "Kirim Artikel"
7. Santri dashboard editor tidak berubah
8. Nav admin sidebar: "Berita" dan "Pena Santri" muncul, "Artikel" lama sudah hilang
