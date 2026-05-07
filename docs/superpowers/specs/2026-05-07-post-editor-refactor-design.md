# PostEditor Refactor — Design Spec

**Date:** 2026-05-07
**Scope:** Refactor SantriPostEditor menjadi shared PostEditor + composable; shared ReviewNoteEditor; hapus halaman review admin yang terpisah; tambah kolom aksi di tabel Artikel admin.

---

## Problem

- `SantriPostEditor.vue` monolitik — logika, template, dan API calls campur jadi satu
- Review workflow admin tersebar di halaman terpisah (`/admin/review`) yang tidak perlu
- `ReviewNoteEditor.vue` hanya bisa dipakai di dashboard (nested di `dashboard/`)
- Reviewer yang menulis post sendiri tidak punya jalur UI yang jelas

---

## Architecture

### Composable: `usePostEditor`

Semua logika berpindah dari `SantriPostEditor.vue` ke composable ini.

```
app/composables/usePostEditor.ts
```

**Input:**
```ts
usePostEditor({ postId?: number })
```

**State yang di-return:**
```ts
{
  // Form
  form: reactive({ title, content, excerpt, categoryId, featuredImage, tags }),
  currentStatus: ref<PostStatus>,
  postStatus: 'idle' | 'pending' | 'success' | 'error',  // fetch state

  // Review (hanya relevan jika showReviewActions)
  reviewNote: ref<string>(''),

  // Loading
  loadingAction: ref<'save' | 'send' | 'approve' | 'reject' | null>,

  // Computed
  categories,
  canSubmit,         // featuredImage && categoryId ada
  wordCount,
  readingTime,
  showReviewActions, // canReview && !isOwnPost && !!postId
  isOwnPost,

  // Handlers
  handleCoverChange(file),
  promptEditorImageUpload(editor),

  // Actions
  saveDraft(),   // hanya !showReviewActions — santri/own post, set status ke draft
  sendPost(),    // hanya !showReviewActions — santri/own post, submit ke pending_review
  approve(),     // hanya showReviewActions — publish artikel (include konten terbaru)
  reject(),      // hanya showReviewActions — tolak artikel, wajib ada reviewNote
}
```

**API routing (by role):**

| Aksi | Santri / Own Post | Reviewer/Admin + Bukan Own |
|------|-------------------|---------------------------|
| Fetch post | `/api/dashboard/santri/posts/${id}` | `/api/admin/posts/${id}` (baru) |
| Fetch meta | `/api/dashboard/santri/posts/meta` | `/api/admin/categories` |
| Save draft | PATCH `/api/dashboard/santri/posts/${id}` | — |
| Send/Submit | POST `/api/dashboard/santri/posts/${id}/submit` | — |
| Approve | — | POST `/api/dashboard/review/${id}/approve` |
| Reject | — | POST `/api/dashboard/review/${id}/reject` |
| Upload cover | POST `/api/dashboard/santri/upload/cover` | POST `/api/dashboard/santri/upload/cover` |
| Upload image | POST `/api/dashboard/santri/upload/editor-image` | POST `/api/dashboard/santri/upload/editor-image` |

> **Note:** Upload endpoints tetap pakai santri API untuk saat ini — reviewer/admin bisa upload tapi melalui endpoint santri (out of scope perbaikan ini). Unifikasi API dilakukan setelah UI selesai.
>
> `submitReview()` untuk approve/reject menyertakan payload konten terbaru (title, content, dll) langsung di body request ke endpoint approve/reject — backend perlu update konten sebelum mengubah status.

**`showReviewActions` flag:**
```ts
const showReviewActions = computed(() =>
  auth.canReview.value && !!props.postId && !isOwnPost.value
)
```
Flag ini satu-satunya yang mengontrol semua perbedaan UI antara mode santri dan mode review.

---

### Component: `PostEditor.vue`

```
app/components/PostEditor.vue
```

Template-only component. Memanggil `usePostEditor({ postId })` dan render hasilnya.

**Props:** `{ postId?: number }`

**Layout:**
```
┌─ UContainer ──────────────────────────────────────────────┐
│  ← Kembali          [Simpan Draft]  [Kirim Artikel / Publish / Tolak]
│                                                             │
│  ┌─ Grid xl:2col ──────────────────────────────────────┐  │
│  │ LEFT (flex-1)              RIGHT (w-80, sidebar)     │  │
│  │ ┌─ Title Card ──┐          ┌─ ReviewNoteEditor ────┐ │  │
│  │ │ UInput judul  │          │ (jika showReview...)   │ │  │
│  │ └───────────────┘          └───────────────────────┘ │  │
│  │ ┌─ Content Card ┐          ┌─ Fields Card ─────────┐ │  │
│  │ │ UEditor       │          │ Cover, Excerpt,        │ │  │
│  │ │               │          │ Kategori, Tags         │ │  │
│  │ └───────────────┘          └───────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

**Action buttons (top bar):**

| Kondisi | Tombol |
|---------|--------|
| `!showReviewActions` | Simpan Draft + Kirim Artikel |
| `showReviewActions` | Tolak (secondary danger) + Publish (primary) |

Tidak ada radio button. Kedua tombol selalu tampil saat `showReviewActions`. `reject()` memvalidasi `reviewNote` tidak kosong sebelum submit.

---

### Component: `ReviewNoteEditor.vue`

Dipindah dari `app/components/dashboard/ReviewNoteEditor.vue` ke:
```
app/components/ReviewNoteEditor.vue
```

Diperluas dari sekedar UEditor menjadi card dengan label dan rich text editor.

**Props:**
```ts
{
  modelValue: string   // review note content
  disabled?: boolean
}
```

**Emits:** `update:modelValue`

**Layout dalam card:**
```
┌─ UCard ──────────────────────────────────────┐
│  header: "Catatan Review"                     │
│  ────────────────────────────────────────    │
│  [UEditor — rich text]                       │
│                                              │
│  hint: "Wajib diisi saat menolak artikel."  │
└──────────────────────────────────────────────┘
```

---

## File Map

### Baru
```
app/composables/usePostEditor.ts
app/components/PostEditor.vue
app/components/ReviewNoteEditor.vue          ← dipindah + diperluas
app/pages/admin/posts/[id]/edit.vue          ← thin wrapper: <PostEditor :post-id="id" />
server/api/admin/posts/[id].get.ts           ← requireAdmin, return post + author.id
server/api/admin/posts/[id].delete.ts        ← requireAdmin, hapus post
```

### Dimodifikasi
```
app/components/dashboard/SantriPostEditor.vue
  → jadi thin wrapper: <PostEditor :post-id="postId" />

app/pages/admin/posts/index.vue
  → tambah kolom Aksi: "Edit" (semua status) + trash icon (semua status)
  → tombol "Edit" → /admin/posts/${id}/edit
  → trash → delete confirm modal

app/pages/dashboard/review/index.vue
  → useLazyFetch + client-side pagination + UCard structure
  → "Buka" button → /dashboard/posts/${id}/edit (bukan /dashboard/review/${id})

app/layouts/admin.vue
  → hapus nav item "Review Artikel"

server/api/admin/posts.get.ts
  → hapus server-side pagination, return semua posts
```

### Dihapus
```
app/pages/admin/review/index.vue
app/pages/admin/review/[id].vue
app/pages/dashboard/review/[id].vue
app/components/dashboard/ReviewNoteEditor.vue   ← diganti oleh app/components/ReviewNoteEditor.vue
```

---

## isOwnPost & author.id

- **Santri endpoint** tidak return `author` — tapi tidak masalah karena query sudah filter `authorId = currentUser.id`, jadi `isOwnPost` selalu `true`
- **Review endpoint** return `author: { id, name, email }` ✓
- **Admin endpoint baru** wajib include `author: { id }` di response ← catatan implementasi

---

## Verification

1. Santri membuka post sendiri (draft/rejected/published) → Simpan Draft + Kirim Artikel, tidak ada ReviewNoteEditor
2. Santri membuka URL post orang lain → 404 (endpoint filter by authorId)
3. Reviewer membuka post sendiri → Simpan Draft + Kirim Artikel (isOwnPost = true)
4. Reviewer membuka post orang lain (dari `/dashboard/review`) → Tolak + Publish + ReviewNoteEditor tampil
5. Klik "Tolak" tanpa isi reviewNote → validasi frontend, blocked dengan toast warning
6. Klik "Publish" → approve langsung tanpa perlu reviewNote
8. Admin membuka post dari `/admin/posts` → sama seperti reviewer (isOwnPost check berlaku)
9. Nav admin tidak tampilkan "Review Artikel"
10. `/admin/review` dan `/admin/review/[id]` → 404
11. SantriPostEditor di dashboard santri tetap berfungsi normal
