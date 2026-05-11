# PostEditor Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor SantriPostEditor menjadi shared PostEditor + usePostEditor composable; hapus halaman review admin yang terpisah; tambah kolom aksi di tabel Artikel admin.

**Architecture:** Semua logika pindah dari `SantriPostEditor.vue` ke composable `usePostEditor.ts`. Composable memilih API endpoint berdasarkan role (`canReview`) dan menghitung `showReviewActions` (canReview && !isOwnPost && !!postId) untuk mengontrol seluruh perbedaan UI antara mode santri dan mode review. `PostEditor.vue` adalah template-only yang memanggil composable.

**Tech Stack:** Nuxt 4, Nuxt UI, Vue 3 Composition API, Drizzle ORM, TypeScript

---

## File Map

### Baru
- `app/components/ReviewNoteEditor.vue` — card + UEditor untuk reviewer menulis catatan penolakan
- `app/composables/usePostEditor.ts` — semua logika editor (fetch, form state, actions, upload)
- `app/components/PostEditor.vue` — template-only, memanggil `usePostEditor`
- `app/pages/admin/posts/[id]/edit.vue` — thin wrapper: `<PostEditor :post-id="id" />`
- `server/api/admin/posts/[id].get.ts` — GET endpoint admin, return post + author.id
- `server/api/admin/posts/[id].delete.ts` — DELETE endpoint admin

### Dimodifikasi
- `app/components/dashboard/SantriPostEditor.vue` → thin wrapper: `<PostEditor :post-id="postId" />`
- `app/pages/admin/posts/index.vue` → tambah kolom aksi + delete modal
- `app/layouts/admin.vue` → hapus nav item "Review Artikel"
- `app/pages/dashboard/review/index.vue` → useLazyFetch + client-side pagination + link baru
- `server/api/admin/posts.get.ts` → hapus server-side pagination
- `server/utils/validation.ts` → hapus page/limit dari `validateAdminPostsQuery`
- `server/api/dashboard/review/[id]/approve.post.ts` → terima content body opsional
- `server/api/dashboard/review/[id]/reject.post.ts` → terima content body opsional

### Dihapus
- `app/pages/admin/review/index.vue`
- `app/pages/admin/review/[id].vue`
- `app/pages/dashboard/review/[id].vue`
- `app/components/dashboard/ReviewNoteEditor.vue`

---

## Task 1: ReviewNoteEditor Component

**Files:**
- Create: `app/components/ReviewNoteEditor.vue`

- [ ] **Step 1: Buat komponen ReviewNoteEditor**

```vue
<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold" } },
    { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline", tooltip: { text: "Underline" } },
    { kind: "mark", mark: "strike", icon: "i-lucide-strikethrough", tooltip: { text: "Strikethrough" } },
  ],
  [
    { kind: "bulletList", icon: "i-lucide-list", tooltip: { text: "Bullet List" } },
    { kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: { text: "Numbered List" } },
  ],
  [
    { kind: "link", icon: "i-lucide-link", tooltip: { text: "Link" } },
  ],
];
</script>

<template>
  <UCard>
    <template #header>
      <p class="font-medium text-sm">Catatan Review</p>
    </template>
    <UEditor
      v-slot="{ editor }"
      :model-value="modelValue"
      :editable="!disabled"
      content-type="html"
      class="min-h-32"
      @update:model-value="$emit('update:modelValue', $event as string)"
    >
      <UEditorToolbar :editor="editor" :items="toolbarItems" />
    </UEditor>
    <p class="text-xs text-muted mt-2">Wajib diisi saat menolak artikel.</p>
  </UCard>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ReviewNoteEditor.vue
git commit -m "feat(ui): add shared ReviewNoteEditor component"
```

---

## Task 2: Server — Admin GET Post Endpoint

**Files:**
- Create: `server/api/admin/posts/[id].get.ts`

- [ ] **Step 1: Cek schema untuk memastikan posts table memiliki kolom yang diperlukan**

```bash
grep -n "reviewNote\|reviewedBy\|featuredImage\|categoryId\|excerpt\|tags" /Users/umarsani/Projects/omahngaji-v2/server/db/schema.ts | head -30
```

- [ ] **Step 2: Buat GET endpoint**

```typescript
// server/api/admin/posts/[id].get.ts
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      featuredImage: true,
      categoryId: true,
      status: true,
      reviewNote: true,
      tags: true,
      updatedAt: true,
      publishedAt: true,
    },
    with: {
      author: { columns: { id: true, name: true, email: true } },
      category: { columns: { id: true, name: true, type: true } },
      reviewer: { columns: { id: true, name: true } },
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  return { data: post }
})
```

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/posts/[id].get.ts
git commit -m "feat(api): add admin GET /api/admin/posts/[id] endpoint"
```

---

## Task 3: Server — Admin DELETE Post Endpoint

**Files:**
- Create: `server/api/admin/posts/[id].delete.ts`

- [ ] **Step 1: Buat DELETE endpoint**

```typescript
// server/api/admin/posts/[id].delete.ts
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: { id: true },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  await db.delete(schema.posts).where(eq(schema.posts.id, postId))

  return { success: true }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/admin/posts/[id].delete.ts
git commit -m "feat(api): add admin DELETE /api/admin/posts/[id] endpoint"
```

---

## Task 4: Server — Update Approve/Reject Endpoints untuk Terima Content

**Files:**
- Modify: `server/api/dashboard/review/[id]/approve.post.ts`
- Modify: `server/api/dashboard/review/[id]/reject.post.ts`
- Modify: `server/utils/validation.ts`

Saat reviewer approve/reject, content terbaru (yang mungkin diedit di editor) ikut disimpan ke DB sebelum status berubah.

- [ ] **Step 1: Tambah `validateReviewActionBody` ke validation.ts**

Tambahkan di akhir file `server/utils/validation.ts`:

```typescript
export function validateReviewActionBody(value: unknown) {
  const body = getRequiredRecord(value)
  return {
    title: getOptionalString(body.title),
    content: typeof body.content === 'string' ? body.content : undefined,
    excerpt: getOptionalString(body.excerpt) ?? null,
    categoryId: (() => {
      if (!('categoryId' in body) || body.categoryId === null || body.categoryId === undefined) return undefined
      const raw = getSingleValue(body.categoryId)
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isInteger(n) && n > 0 ? n : undefined
    })(),
    featuredImage: getOptionalString(body.featuredImage) ?? null,
    tags: Array.isArray(body.tags) && body.tags.every(t => typeof t === 'string') ? body.tags as string[] : undefined,
  }
}

export function validateRejectWithContentBody(value: unknown) {
  const body = getRequiredRecord(value)
  const reviewNote = getOptionalString(body.reviewNote)

  if (!reviewNote) {
    throw createError({ statusCode: 400, message: 'Catatan review wajib diisi saat menolak artikel.' })
  }

  const contentFields = validateReviewActionBody(value)
  return { reviewNote, ...contentFields }
}
```

- [ ] **Step 2: Update approve.post.ts untuk terima content opsional**

```typescript
// server/api/dashboard/review/[id]/approve.post.ts
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateReviewActionBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const contentUpdate = await readValidatedBody(event, validateReviewActionBody)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: { id: true, title: true, slug: true, status: true },
    with: { author: { columns: { name: true, email: true } } },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  if (post.status !== 'pending_review') {
    throw createError({ statusCode: 409, message: 'Post tidak dalam status pending review.' })
  }

  const now = new Date()

  const updatePayload: Record<string, unknown> = {
    status: 'published',
    publishedAt: now,
    reviewedBy: reviewer.id,
  }
  if (contentUpdate.title !== undefined) updatePayload.title = contentUpdate.title
  if (contentUpdate.content !== undefined) updatePayload.content = contentUpdate.content
  if (contentUpdate.excerpt !== undefined) updatePayload.excerpt = contentUpdate.excerpt
  if (contentUpdate.categoryId !== undefined) updatePayload.categoryId = contentUpdate.categoryId
  if (contentUpdate.featuredImage !== undefined) updatePayload.featuredImage = contentUpdate.featuredImage
  if (contentUpdate.tags !== undefined) updatePayload.tags = contentUpdate.tags

  await db.update(schema.posts)
    .set(updatePayload)
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu telah dipublish — ${contentUpdate.title ?? post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${contentUpdate.title ?? post.title}</strong> telah disetujui dan dipublish oleh <strong>${reviewer.name}</strong>.</p>
      <p>Baca di: <a href="https://ojialanshori.com/post/${post.slug}">ojialanshori.com/post/${post.slug}</a></p>
      <p>Terimakasih sudah berkontribusi!</p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${contentUpdate.title ?? post.title}" telah dipublish oleh ${reviewer.name}.\n\nhttps://ojialanshori.com/post/${post.slug}`,
  })

  return { id: postId, status: 'published' as const, publishedAt: now }
})
```

- [ ] **Step 3: Update reject.post.ts untuk terima content opsional**

```typescript
// server/api/dashboard/review/[id]/reject.post.ts
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRejectWithContentBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const { reviewNote, ...contentUpdate } = await readValidatedBody(event, validateRejectWithContentBody)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: { id: true, title: true, slug: true, status: true },
    with: { author: { columns: { name: true, email: true } } },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  if (post.status !== 'pending_review') {
    throw createError({ statusCode: 409, message: 'Post tidak dalam status pending review.' })
  }

  const updatePayload: Record<string, unknown> = {
    status: 'rejected',
    reviewNote,
    reviewedBy: reviewer.id,
  }
  if (contentUpdate.title !== undefined) updatePayload.title = contentUpdate.title
  if (contentUpdate.content !== undefined) updatePayload.content = contentUpdate.content
  if (contentUpdate.excerpt !== undefined) updatePayload.excerpt = contentUpdate.excerpt
  if (contentUpdate.categoryId !== undefined) updatePayload.categoryId = contentUpdate.categoryId
  if (contentUpdate.featuredImage !== undefined) updatePayload.featuredImage = contentUpdate.featuredImage
  if (contentUpdate.tags !== undefined) updatePayload.tags = contentUpdate.tags

  await db.update(schema.posts)
    .set(updatePayload)
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu membutuhkan revisi — ${contentUpdate.title ?? post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${contentUpdate.title ?? post.title}</strong> membutuhkan beberapa revisi sebelum bisa dipublish.</p>
      <p><strong>Catatan dari ${reviewer.name}:</strong></p>
      <div style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;">${reviewNote}</div>
      <p><a href="https://ojialanshori.com/dashboard/posts/${post.id}/edit">Edit Artikel</a></p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${contentUpdate.title ?? post.title}" membutuhkan revisi.\n\nEdit di: https://ojialanshori.com/dashboard/posts/${post.id}/edit`,
  })

  return { id: postId, status: 'rejected' as const }
})
```

- [ ] **Step 4: Commit**

```bash
git add server/utils/validation.ts server/api/dashboard/review/[id]/approve.post.ts server/api/dashboard/review/[id]/reject.post.ts
git commit -m "feat(api): approve/reject endpoints accept optional content update payload"
```

---

## Task 5: Server — Hapus Paginasi dari Admin Posts

**Files:**
- Modify: `server/api/admin/posts.get.ts`
- Modify: `server/utils/validation.ts`

- [ ] **Step 1: Update `validateAdminPostsQuery` di validation.ts — hapus page/limit**

Ganti fungsi `validateAdminPostsQuery` (baris 262–273):

```typescript
export function validateAdminPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const status = getOptionalString(query.status)

  return {
    status: status && VALID_SANTRI_POST_STATUSES.includes(status as PostStatus)
      ? status as PostStatus
      : undefined,
  }
}
```

- [ ] **Step 2: Update `server/api/admin/posts.get.ts` — hapus pagination**

```typescript
import { desc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminPostsQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const query = await getValidatedQuery(event, validateAdminPostsQuery)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)
  const whereClause = query.status ? eq(schema.posts.status, query.status) : undefined

  const posts = await db.query.posts.findMany({
    where: whereClause,
    orderBy: [desc(schema.posts.updatedAt)],
    columns: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
    },
    with: {
      author: { columns: { id: true, name: true } },
      category: { columns: { id: true, name: true, type: true } },
    },
  })

  return { data: posts }
})
```

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/posts.get.ts server/utils/validation.ts
git commit -m "refactor(api): remove server-side pagination from admin posts endpoint"
```

---

## Task 6: usePostEditor Composable

**Files:**
- Create: `app/composables/usePostEditor.ts`

Semua logika dari `SantriPostEditor.vue` dipindah ke sini. Perbedaan:
- `isReviewer` → gunakan `auth.canReview.value` untuk pilih endpoint
- `isOwnPost` → computed dari `auth.user.id === postData.author?.id`
- `showReviewActions` → computed flag tunggal yang mengontrol semua perbedaan
- `reviewNote` → input reviewer untuk catatan penolakan (bukan dari post data)
- `existingReviewNote` + `reviewerName` → dari post data, ditampilkan ke santri
- Hapus redirect `pending_review` untuk reviewer (hanya santri yang di-redirect)

- [ ] **Step 1: Buat composable**

```typescript
// app/composables/usePostEditor.ts
import Emoji from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";

import { editorEmojiItems } from "~/utils/editorEmoji";

type RichTextEditor = {
  chain: () => {
    focus: () => {
      run?: () => boolean;
      setImage: (attrs: { alt?: string; src: string }) => { run: () => boolean };
    };
  };
  isActive: (name: string) => boolean;
  isEditable: boolean;
};

type EditorPost = {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: "draft" | "pending_review" | "published" | "rejected";
  reviewNote: string | null;
  tags: string[];
  author?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string } | null;
};

type CategoryItem = { id: number; name: string; type: string };

export function usePostEditor(opts: { postId?: number }) {
  const auth = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { postId } = opts;

  // --- Form state ---
  const form = reactive({
    title: "",
    content: "",
    excerpt: "",
    categoryId: undefined as number | undefined,
    featuredImage: null as string | null,
    tags: [] as string[],
  });

  const currentStatus = ref<EditorPost["status"]>("draft");
  const existingReviewNote = ref<string | null>(null);
  const reviewerName = ref<string | null>(null);
  const reviewNote = ref(""); // reviewer input for rejection
  const loadingAction = ref<"save" | "send" | "approve" | "reject" | null>(null);
  const uploadingEditorImage = ref(false);
  const coverInputKey = ref(0);
  const coverFile = ref<File | null>(null);

  // --- Categories ---
  const { data: categoriesRaw } = useAsyncData<CategoryItem[]>(
    "post-editor-categories",
    async () => {
      if (auth.canReview.value) {
        const res = await $fetch<{ data: CategoryItem[] }>("/api/admin/categories");
        return res.data;
      }
      const res = await $fetch<{ categories: CategoryItem[] }>(
        "/api/dashboard/santri/posts/meta"
      );
      return res.categories;
    },
    { lazy: true, default: () => [] }
  );

  const categories = computed(() =>
    (categoriesRaw.value ?? []).map((c) => ({
      label:
        c.type === "berita" ? `Berita · ${c.name}` : `Pena Santri · ${c.name}`,
      value: c.id,
    }))
  );

  // --- Post fetch ---
  const { data: postData, status: postStatus } = useAsyncData<EditorPost | null>(
    `post-editor-${postId ?? "new"}`,
    () => {
      if (!postId) return Promise.resolve(null);
      const url = auth.canReview.value
        ? `/api/admin/posts/${postId}`
        : `/api/dashboard/santri/posts/${postId}`;
      return $fetch<{ data: EditorPost }>(url).then((r) => r.data);
    },
    { lazy: true, immediate: !!postId, default: () => null }
  );

  // --- isOwnPost ---
  const isOwnPost = computed(() => {
    if (!auth.canReview.value) return true; // santri API filters by authorId
    return auth.user.value?.id === postData.value?.author?.id;
  });

  // --- showReviewActions: single flag that controls all UI differences ---
  const showReviewActions = computed(
    () => auth.canReview.value && !!postId && !isOwnPost.value
  );

  // --- Populate form when post loads ---
  watch(
    postData,
    (post) => {
      if (!post) return;
      form.title = post.title;
      form.content = post.content;
      form.excerpt = post.excerpt ?? "";
      form.categoryId = post.categoryId ?? undefined;
      form.featuredImage = post.featuredImage;
      form.tags = [...post.tags];
      currentStatus.value = post.status;
      existingReviewNote.value = post.reviewNote;
      reviewerName.value = post.reviewer?.name ?? null;

      // Santri: redirect if pending_review (cannot edit while in review)
      if (
        !auth.canReview.value &&
        post.status === "pending_review" &&
        import.meta.client
      ) {
        toast.add({
          title: "Artikel sedang direview",
          description: "Artikel yang berstatus menunggu review tidak bisa diedit.",
          color: "warning",
          icon: "i-lucide-clock-3",
        });
        void navigateTo("/dashboard/posts?status=pending_review", { replace: true });
      }
    },
    { immediate: true }
  );

  watch(coverFile, (file) => { void handleCoverChange(file); });

  // --- Computed ---
  const canSubmit = computed(() =>
    Boolean(form.featuredImage && form.categoryId !== undefined)
  );

  const titleCount = computed(() => form.title.length);

  const plainTextContent = computed(() =>
    form.content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  const wordCount = computed(() =>
    plainTextContent.value ? plainTextContent.value.split(" ").length : 0
  );

  const readingTime = computed(() =>
    wordCount.value > 0 ? Math.ceil(wordCount.value / 200) : 0
  );

  const statusLabel = computed(
    () =>
      ({
        draft: "Draft",
        pending_review: "Dalam Review",
        rejected: "Ditolak",
        published: "Terbit",
      })[currentStatus.value]
  );

  const statusColor = computed(
    () =>
      ({
        draft: "neutral",
        pending_review: "warning",
        rejected: "error",
        published: "success",
      })[currentStatus.value] as "neutral" | "warning" | "error" | "success"
  );

  // --- Editor config (used in PostEditor.vue template) ---
  const editorExtensions = [
    Emoji,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];

  // --- Helpers ---
  function buildPayload() {
    return {
      title: form.title.trim(),
      content: form.content,
      excerpt: form.excerpt.trim() || null,
      categoryId: form.categoryId ?? null,
      featuredImage: form.featuredImage,
      tags: form.tags,
    };
  }

  function errorMessage(e: unknown) {
    return (
      (e as { data?: { message?: string } }).data?.message ??
      (e as Error).message ??
      "Terjadi kesalahan."
    );
  }

  // --- Actions ---
  async function saveDraft({ silent = false, redirectAfterCreate = true, manageLoading = true } = {}) {
    if (manageLoading) loadingAction.value = "save";
    try {
      const payload = buildPayload();
      const response = postId
        ? await $fetch<{ id: number; status: EditorPost["status"] }>(
            `/api/dashboard/santri/posts/${postId}`,
            { method: "PATCH", body: payload }
          )
        : await $fetch<{ id: number; status: EditorPost["status"] }>(
            "/api/dashboard/santri/posts",
            { method: "POST", body: payload }
          );

      currentStatus.value = response.status;
      existingReviewNote.value = null;

      if (!postId && redirectAfterCreate) {
        await router.replace(`/dashboard/posts/${response.id}/edit`);
      }
      if (!silent) {
        toast.add({ title: "Draft disimpan", color: "success", icon: "i-lucide-check" });
      }
      return response.id;
    } catch (e) {
      if (!silent) {
        toast.add({ title: "Gagal menyimpan draft", description: errorMessage(e), color: "error", icon: "i-lucide-alert-circle" });
      }
      return null;
    } finally {
      if (manageLoading) loadingAction.value = null;
    }
  }

  async function sendPost() {
    loadingAction.value = "send";
    try {
      const payload = buildPayload();
      const resolvedId = postId
        ? postId
        : await saveDraft({ silent: true, redirectAfterCreate: false, manageLoading: false });

      if (!resolvedId) return;

      const response = await $fetch<{ status: EditorPost["status"] }>(
        `/api/dashboard/santri/posts/${resolvedId}/submit`,
        { method: "POST", body: payload }
      );

      currentStatus.value = response.status;
      existingReviewNote.value = null;

      toast.add({
        title: "Artikel dikirim untuk review",
        color: "success",
        icon: "i-lucide-send",
      });
      await navigateTo("/dashboard/posts?status=pending_review");
    } catch (e) {
      toast.add({ title: "Gagal mengirim artikel", description: errorMessage(e), color: "error", icon: "i-lucide-alert-circle" });
    } finally {
      loadingAction.value = null;
    }
  }

  async function approve() {
    if (!postId) return;
    loadingAction.value = "approve";
    try {
      await $fetch(`/api/dashboard/review/${postId}/approve`, {
        method: "POST",
        body: buildPayload(),
      });
      toast.add({ title: "Artikel dipublish", color: "success", icon: "i-lucide-check-circle" });
      await navigateTo("/admin/posts");
    } catch (e) {
      toast.add({ title: "Gagal publish", description: errorMessage(e), color: "error", icon: "i-lucide-x-circle" });
    } finally {
      loadingAction.value = null;
    }
  }

  async function reject() {
    if (!postId) return;
    if (!reviewNote.value.trim()) {
      toast.add({ title: "Catatan review wajib diisi", color: "warning", icon: "i-lucide-alert-triangle" });
      return;
    }
    loadingAction.value = "reject";
    try {
      await $fetch(`/api/dashboard/review/${postId}/reject`, {
        method: "POST",
        body: { reviewNote: reviewNote.value, ...buildPayload() },
      });
      toast.add({ title: "Artikel ditolak", color: "warning", icon: "i-lucide-x-circle" });
      await navigateTo("/admin/posts");
    } catch (e) {
      toast.add({ title: "Gagal menolak", description: errorMessage(e), color: "error", icon: "i-lucide-x-circle" });
    } finally {
      loadingAction.value = null;
    }
  }

  // --- Image upload ---
  async function getImageDimensions(file: File) {
    const objectUrl = URL.createObjectURL(file);
    try {
      return await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Cover tidak bisa dibaca."));
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleCoverChange(file: File | null | undefined) {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran cover maksimal 2MB.");
      const { width, height } = await getImageDimensions(file);
      if (width < 1000 || height < 1000) {
        throw new Error("Ukuran cover minimal 1000px di sisi lebar dan tinggi.");
      }
      const formData = new FormData();
      formData.append("cover", file);
      const response = await $fetch<{ path: string }>("/api/dashboard/santri/upload/cover", {
        method: "POST",
        body: formData,
      });
      form.featuredImage = response.path;
      coverInputKey.value += 1;
      coverFile.value = null;
      toast.add({ title: "Cover berhasil diunggah", color: "success", icon: "i-lucide-check" });
    } catch (e) {
      toast.add({ title: "Gagal mengunggah cover", description: errorMessage(e), color: "error", icon: "i-lucide-alert-circle" });
    }
  }

  async function promptEditorImageUpload(editor: RichTextEditor) {
    if (!import.meta.client || uploadingEditorImage.value) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      try {
        uploadingEditorImage.value = true;
        if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 2MB.");
        const formData = new FormData();
        formData.append("image", file);
        const response = await $fetch<{ url: string }>(
          "/api/dashboard/santri/upload/editor-image",
          { method: "POST", body: formData }
        );
        editor.chain().focus().setImage({ src: response.url, alt: file.name.replace(/\.[^/.]+$/, "") }).run();
        toast.add({ title: "Gambar berhasil diunggah", color: "success", icon: "i-lucide-check" });
      } catch (e) {
        toast.add({ title: "Gagal mengunggah gambar", description: errorMessage(e), color: "error", icon: "i-lucide-alert-circle" });
      } finally {
        uploadingEditorImage.value = false;
      }
    };
    input.click();
  }

  return {
    // Form
    form,
    currentStatus,
    postStatus,
    existingReviewNote,
    reviewerName,
    reviewNote,
    loadingAction,
    uploadingEditorImage,
    coverFile,
    coverInputKey,
    // Computed
    categories,
    canSubmit,
    titleCount,
    wordCount,
    readingTime,
    statusLabel,
    statusColor,
    showReviewActions,
    isOwnPost,
    // Editor config
    editorExtensions,
    editorEmojiItems,
    // Handlers
    handleCoverChange,
    promptEditorImageUpload,
    // Actions
    saveDraft,
    sendPost,
    approve,
    reject,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/usePostEditor.ts
git commit -m "feat(composable): add usePostEditor with role-aware API routing and review actions"
```

---

## Task 7: PostEditor.vue Template Component

**Files:**
- Create: `app/components/PostEditor.vue`

Template-only component. Memanggil `usePostEditor({ postId: props.postId })` dan render hasilnya. Semua toolbar config dan editor extensions datang dari composable.

- [ ] **Step 1: Buat PostEditor.vue**

```vue
<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

const props = defineProps<{
  postId?: number;
}>();

const {
  form,
  currentStatus,
  postStatus,
  existingReviewNote,
  reviewerName,
  reviewNote,
  loadingAction,
  uploadingEditorImage,
  coverFile,
  coverInputKey,
  categories,
  canSubmit,
  titleCount,
  wordCount,
  readingTime,
  showReviewActions,
  editorExtensions,
  editorEmojiItems,
  promptEditorImageUpload,
  saveDraft,
  sendPost,
  approve,
  reject,
} = usePostEditor({ postId: props.postId });

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: "undo", icon: "i-lucide-undo", tooltip: { text: "Undo" } },
    { kind: "redo", icon: "i-lucide-redo", tooltip: { text: "Redo" } },
  ],
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "Headings" },
      content: { align: "start" },
      items: [
        { kind: "heading", level: 1, icon: "i-lucide-heading-1", label: "Heading 1" },
        { kind: "heading", level: 2, icon: "i-lucide-heading-2", label: "Heading 2" },
        { kind: "heading", level: 3, icon: "i-lucide-heading-3", label: "Heading 3" },
        { kind: "heading", level: 4, icon: "i-lucide-heading-4", label: "Heading 4" },
      ],
    },
    {
      icon: "i-lucide-align-justify",
      tooltip: { text: "Text Align" },
      content: { align: "end" },
      items: [
        { kind: "textAlign", align: "left", icon: "i-lucide-align-left", label: "Align Left" },
        { kind: "textAlign", align: "center", icon: "i-lucide-align-center", label: "Align Center" },
        { kind: "textAlign", align: "right", icon: "i-lucide-align-right", label: "Align Right" },
        { kind: "textAlign", align: "justify", icon: "i-lucide-align-justify", label: "Align Justify" },
      ],
    },
    { kind: "bulletList", icon: "i-lucide-list", tooltip: { text: "Bullet List" } },
    { kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: { text: "Ordered List" } },
    { kind: "blockquote", icon: "i-lucide-text-quote", tooltip: { text: "Blockquote" } },
    { kind: "codeBlock", icon: "i-lucide-square-code", tooltip: { text: "Code Block" } },
    { kind: "horizontalRule", icon: "i-lucide-separator-horizontal", tooltip: { text: "Horizontal Rule" } },
  ],
  [
    { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold" } },
    { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline", tooltip: { text: "Underline" } },
    { kind: "mark", mark: "strike", icon: "i-lucide-strikethrough", tooltip: { text: "Strikethrough" } },
    { kind: "mark", mark: "code", icon: "i-lucide-code", tooltip: { text: "Code" } },
  ],
  [
    { kind: "link", icon: "i-lucide-link", tooltip: { text: "Link" } },
    { kind: "image", icon: "i-lucide-image-up", tooltip: { text: "Upload Image" } },
  ],
];

const suggestionItems = [
  [
    { type: "label" as const, label: "Teks" },
    { kind: "heading" as const, level: 2, label: "Heading besar", description: "Buat subjudul utama", icon: "i-lucide-heading-2" },
    { kind: "heading" as const, level: 3, label: "Heading kecil", description: "Buat subjudul lanjutan", icon: "i-lucide-heading-3" },
    { kind: "paragraph" as const, label: "Paragraf", description: "Kembali ke teks biasa", icon: "i-lucide-pilcrow" },
  ],
  [
    { type: "label" as const, label: "Blok" },
    { kind: "bulletList" as const, label: "Daftar poin", description: "Tampilkan list berpoin", icon: "i-lucide-list" },
    { kind: "orderedList" as const, label: "Daftar nomor", description: "Tampilkan list bernomor", icon: "i-lucide-list-ordered" },
    { kind: "blockquote" as const, label: "Kutipan", description: "Sorot kutipan penting", icon: "i-lucide-quote" },
    { kind: "image" as const, label: "Gambar", description: "Unggah gambar ke isi artikel", icon: "i-lucide-image-up" },
    { kind: "emoji" as const, label: "Emoji", description: "Cari emoji dengan cepat", icon: "i-lucide-smile" },
  ],
];

const editorHandlers = {
  image: {
    canExecute: (editor: { isEditable: boolean }) => editor.isEditable,
    execute: (editor: Parameters<typeof promptEditorImageUpload>[0]) => {
      void promptEditorImageUpload(editor);
      return editor.chain().focus();
    },
    isActive: (editor: { isActive: (name: string) => boolean }) => editor.isActive("image"),
    isDisabled: () => uploadingEditorImage.value,
  },
};

const backTo = computed(() =>
  showReviewActions.value ? "/admin/posts" : "/dashboard/posts"
);
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50">
    <UContainer>
      <!-- Action bar -->
      <div class="flex flex-col gap-3 px-2 mb-4 md:flex-row md:items-center md:justify-between">
        <UButton
          :to="backTo"
          variant="link"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="justify-start"
        >
          Kembali
        </UButton>

        <div class="flex flex-col gap-2 sm:flex-row">
          <!-- Review mode: Tolak + Publish -->
          <template v-if="showReviewActions">
            <UButton
              color="error"
              variant="subtle"
              :loading="loadingAction === 'reject'"
              :disabled="!!loadingAction"
              @click="reject()"
            >
              Tolak
            </UButton>
            <UButton
              color="success"
              :loading="loadingAction === 'approve'"
              :disabled="!!loadingAction"
              @click="approve()"
            >
              Publish
            </UButton>
          </template>

          <!-- Santri mode: Simpan Draft + Kirim Artikel -->
          <template v-else>
            <UButton
              variant="subtle"
              :loading="loadingAction === 'save'"
              :disabled="!!loadingAction"
              @click="saveDraft()"
            >
              Simpan Draft
            </UButton>
            <UButton
              color="primary"
              :disabled="!canSubmit || !!loadingAction"
              :loading="loadingAction === 'send'"
              @click="sendPost()"
            >
              Kirim Artikel
            </UButton>
          </template>
        </div>
      </div>

      <!-- Main grid -->
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">

        <!-- Left column -->
        <div class="min-w-0">
          <div v-if="postStatus === 'pending'" class="py-10 text-sm text-muted">
            Memuat editor...
          </div>

          <div v-else class="flex h-full flex-col gap-5">
            <!-- Rejection notice for santri -->
            <UAlert
              v-if="!showReviewActions && currentStatus === 'rejected' && existingReviewNote"
              color="error"
              variant="subtle"
              icon="i-lucide-triangle-alert"
              title="Catatan Penolakan"
            >
              <template #description>
                <p v-if="reviewerName" class="text-xs text-muted mb-2">
                  Direview oleh: <strong>{{ reviewerName }}</strong>
                </p>
                <div class="prose prose-sm max-w-none" v-html="existingReviewNote" />
              </template>
            </UAlert>

            <!-- Title card -->
            <UCard :ui="{ body: 'p-5 md:p-6' }">
              <UFormField label="Judul" name="title" required>
                <UInput
                  v-model="form.title"
                  class="w-full"
                  size="xl"
                  maxlength="120"
                  placeholder="Tulis judul artikel"
                />
              </UFormField>
              <p class="mt-3 text-xs text-dimmed">{{ titleCount }}/120 karakter</p>
            </UCard>

            <!-- Content card -->
            <UCard
              class="flex-1"
              :ui="{ root: 'h-full', body: 'pt-2!' }"
            >
              <template #header>
                <h2 class="text-sm font-semibold">Konten</h2>
              </template>

              <UEditor
                v-model="form.content"
                autofocus="start"
                content-type="html"
                :extensions="editorExtensions"
                :handlers="editorHandlers"
                :placeholder="{ placeholder: 'Mulai menulis isi artikel kamu...', mode: 'firstLine' }"
                :starter-kit="{ link: { openOnClick: false } }"
                :ui="{ root: 'min-h-[520px]', content: 'py-4', base: 'min-h-[420px] max-w-none px-2!' }"
              >
                <template #default="{ editor }">
                  <UEditorToolbar :editor="editor" :items="toolbarItems" size="md" />
                  <UEditorEmojiMenu
                    :editor="editor"
                    :items="editorEmojiItems"
                    :limit="48"
                    :suggestion="{ allowedPrefixes: null }"
                  />
                </template>
              </UEditor>

              <template #footer>
                <div class="text-sm text-right">
                  {{ wordCount }} kata · {{ readingTime }} menit baca
                </div>
              </template>
            </UCard>
          </div>
        </div>

        <!-- Right sidebar -->
        <aside class="min-w-0 space-y-5">
          <!-- ReviewNoteEditor: hanya untuk reviewer bukan pemilik post -->
          <ReviewNoteEditor
            v-if="showReviewActions"
            v-model="reviewNote"
            :disabled="!!loadingAction"
          />

          <!-- Fields card -->
          <UCard :ui="{ body: 'p-5' }">
            <div class="space-y-5">
              <UFormField label="Gambar Sampul" name="featuredImage" required>
                <div class="space-y-3">
                  <UFileUpload
                    :key="coverInputKey"
                    v-model="coverFile"
                    accept="image/jpeg,image/png,image/webp"
                    variant="area"
                    size="md"
                    icon="i-lucide-image-up"
                    label="Pilih gambar atau jatuhkan"
                    :highlight="!form.featuredImage"
                    class="min-h-40 w-full"
                  />
                  <div
                    v-if="form.featuredImage"
                    class="overflow-hidden rounded-xl border border-default"
                  >
                    <img
                      :src="form.featuredImage"
                      alt="Preview cover artikel"
                      class="h-40 w-full object-cover"
                    />
                  </div>
                  <div class="text-sm text-muted">
                    Maksimal ukuran file 2MB. Direkomendasikan aspek rasio 3:2.
                  </div>
                </div>
              </UFormField>

              <UFormField label="Ringkasan" name="excerpt">
                <UTextarea
                  v-model="form.excerpt"
                  class="w-full"
                  :rows="4"
                  maxlength="200"
                  autoresize
                  placeholder="Tulis ringkasan singkat artikel..."
                />
                <div class="mt-2 flex justify-end">
                  <span class="text-sm text-muted">{{ form.excerpt.length }}/200</span>
                </div>
              </UFormField>

              <div class="space-y-4">
                <UFormField label="Kategori" name="categoryId" required>
                  <USelect
                    v-model="form.categoryId"
                    class="w-full"
                    :items="categories"
                    placeholder="Pilih kategori"
                  />
                </UFormField>

                <UFormField label="Tag" name="tags">
                  <UInputTags
                    v-model="form.tags"
                    class="w-full"
                    :max="10"
                    :max-length="40"
                    delimiter=","
                  />
                </UFormField>
              </div>
            </div>
          </UCard>
        </aside>
      </div>
    </UContainer>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/PostEditor.vue
git commit -m "feat(ui): add shared PostEditor template component"
```

---

## Task 8: Admin Edit Page

**Files:**
- Create: `app/pages/admin/posts/[id]/edit.vue`

- [ ] **Step 1: Buat halaman edit admin**

```vue
<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Edit Artikel",
});

const route = useRoute();
const postId = Number(route.params.id);
</script>

<template>
  <PostEditor :post-id="postId" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/admin/posts/[id]/edit.vue
git commit -m "feat(pages): add admin post edit page at /admin/posts/[id]/edit"
```

---

## Task 9: Refactor SantriPostEditor → Thin Wrapper

**Files:**
- Modify: `app/components/dashboard/SantriPostEditor.vue`

- [ ] **Step 1: Ganti seluruh konten SantriPostEditor dengan thin wrapper**

```vue
<script setup lang="ts">
defineProps<{
  postId?: number;
}>();
</script>

<template>
  <PostEditor :post-id="postId" />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/SantriPostEditor.vue
git commit -m "refactor(ui): SantriPostEditor becomes thin wrapper around PostEditor"
```

---

## Task 10: Admin Posts Table — Tambah Aksi + Delete Modal

**Files:**
- Modify: `app/pages/admin/posts/index.vue`

Tambah kolom Aksi: "Edit" (semua status) + trash icon. Edit button → `/admin/posts/${id}/edit`. Trash → delete confirm modal yang memanggil DELETE `/api/admin/posts/${id}`.

- [ ] **Step 1: Update admin/posts/index.vue**

Ganti seluruh file:

```vue
<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Artikel",
});

type AdminPost = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  updatedAt: string;
  publishedAt: string | null;
  author: { id: number; name: string };
  category: { id: number; name: string; type: "berita" | "pena_santri" } | null;
};

const STATUS_OPTIONS = [
  { label: "Terbit", value: "published" },
  { label: "Dalam Review", value: "pending_review" },
  { label: "Draft", value: "draft" },
  { label: "Ditolak", value: "rejected" },
];

const STATUS_COLOR: Record<string, "success" | "warning" | "neutral" | "error"> = {
  published: "success",
  pending_review: "warning",
  draft: "neutral",
  rejected: "error",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Terbit",
  pending_review: "Dalam Review",
  draft: "Draft",
  rejected: "Ditolak",
};

const PAGE_SIZE = 10;
const page = ref(1);
const statusFilter = ref("");

const toast = useToast();

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>("/api/admin/posts");

const posts = computed(() => data.value?.data ?? []);

const filteredPosts = computed(() => {
  if (!statusFilter.value) return posts.value;
  return posts.value.filter((p) => p.status === statusFilter.value);
});

const total = computed(() => filteredPosts.value.length);

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredPosts.value.slice(start, start + PAGE_SIZE);
});

watch(statusFilter, () => { page.value = 1; });

const isDeleteModalOpen = ref(false);
const deletingId = ref<number | null>(null);
const deleting = ref(false);

function confirmDelete(id: number) {
  deletingId.value = id;
  isDeleteModalOpen.value = true;
}

async function doDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/posts/${deletingId.value}`, { method: "DELETE" });
    toast.add({ title: "Artikel dihapus", color: "success", icon: "i-lucide-check-circle" });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } }).data?.message ?? (e as Error).message ?? "Terjadi kesalahan.";
    toast.add({ title: "Gagal menghapus", description: msg, color: "error", icon: "i-lucide-x-circle" });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const columns: TableColumn<AdminPost>[] = [
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) =>
      h("span", { class: "font-medium line-clamp-2" }, row.original.title),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    cell: ({ row }) => h("span", {}, row.original.author.name),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      h(UBadge, {
        label: STATUS_LABEL[row.original.status] ?? row.original.status,
        color: STATUS_COLOR[row.original.status] ?? "neutral",
        variant: "subtle",
      }),
  },
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) =>
      row.original.category
        ? h("span", {}, row.original.category.name)
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "updatedAt",
    header: "Diperbarui",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-muted text-sm" },
        new Date(row.original.updatedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      ),
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "flex gap-1 justify-end" }, [
        h(UButton, {
          size: "sm",
          variant: "ghost",
          icon: "i-lucide-pencil",
          to: `/admin/posts/${row.original.id}/edit`,
        }),
        h(UButton, {
          size: "sm",
          variant: "ghost",
          color: "error",
          icon: "i-lucide-trash-2",
          onClick: () => confirmDelete(row.original.id),
        }),
      ]),
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <USelect
          v-model="statusFilter"
          :items="STATUS_OPTIONS"
          value-key="value"
          label-key="label"
          placeholder="Semua status"
          class="w-44"
        />
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable
        :data="paginatedPosts"
        :columns="columns"
        :loading="status === 'pending'"
      >
        <template #empty>
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada artikel ditemukan.</p>
          </div>
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-muted shrink-0">Total {{ total }} artikel</p>
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="PAGE_SIZE"
          size="sm"
          variant="ghost"
        />
      </div>
    </template>
  </UCard>

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Artikel">
    <template #body>
      <p class="text-sm">Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa dibatalkan.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/admin/posts/index.vue
git commit -m "feat(ui): add edit and delete actions to admin posts table"
```

---

## Task 11: Admin Layout — Hapus Nav "Review Artikel"

**Files:**
- Modify: `app/layouts/admin.vue`

- [ ] **Step 1: Hapus nav item "Review Artikel" dari navLinks computed**

Hapus blok berikut dari `navLinks` computed (baris 54–62):

```typescript
{
  label: "Review Artikel",
  icon: "i-ph-clipboard-text-duotone",
  to: "/admin/review",
  active: isActive("/admin/review"),
  onSelect: () => {
    open.value = false;
  },
},
```

- [ ] **Step 2: Commit**

```bash
git add app/layouts/admin.vue
git commit -m "feat(ui): remove Review Artikel nav item from admin sidebar"
```

---

## Task 12: Dashboard Review Page — Refactor ke Client-Side

**Files:**
- Modify: `app/pages/dashboard/review/index.vue`

Ganti `await useFetch` + server pagination menjadi `useLazyFetch` + client-side. Update link "Buka" ke `/dashboard/posts/${id}/edit` (bukan `/dashboard/review/${id}`).

- [ ] **Step 1: Update halaman review**

```vue
<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "reviewer",
});

type QueuePost = {
  id: number;
  title: string;
  updatedAt: string;
  author: { id: number; name: string };
  category: { id: number; name: string; type: "berita" | "pena_santri" } | null;
};

const PAGE_SIZE = 10;
const page = ref(1);

const { data, status } = useLazyFetch<{ data: QueuePost[]; total: number }>(
  "/api/dashboard/review/queue",
  { key: "dashboard-review-queue" }
);

const posts = computed(() => data.value?.data ?? []);
const total = computed(() => posts.value.length);

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return posts.value.slice(start, start + PAGE_SIZE);
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const columns: TableColumn<QueuePost>[] = [
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) =>
      h("span", { class: "font-medium line-clamp-2" }, row.original.title),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    cell: ({ row }) => h("span", {}, row.original.author.name),
  },
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) =>
      row.original.category
        ? h(UBadge, {
            label: row.original.category.name,
            color: row.original.category.type === "berita" ? "info" : "secondary",
            variant: "subtle",
          })
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "updatedAt",
    header: "Dikirim",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-muted text-sm" },
        new Date(row.original.updatedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      ),
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) =>
      h(UButton, {
        label: "Buka",
        size: "sm",
        color: "primary",
        variant: "outline",
        to: `/dashboard/posts/${row.original.id}/edit`,
      }),
  },
];
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-xl font-semibold">Antrian Review</h1>
      <p class="text-muted text-sm mt-1">
        Artikel yang menunggu persetujuan sebelum dipublish.
      </p>
    </div>

    <UTable
      :data="paginatedPosts"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #empty>
        <div class="py-12 text-center">
          <p class="text-muted">Tidak ada artikel yang menunggu review.</p>
        </div>
      </template>
    </UTable>

    <div v-if="total > PAGE_SIZE" class="flex justify-center">
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="PAGE_SIZE"
      />
    </div>
  </div>
</template>
```

**Catatan:** Endpoint `/api/dashboard/review/queue` masih menggunakan server-side pagination. Queue biasanya jumlahnya kecil, jadi client-side pagination sudah cukup. Jika perlu, endpoint bisa diupdate nanti untuk return semua data.

- [ ] **Step 2: Commit**

```bash
git add app/pages/dashboard/review/index.vue
git commit -m "refactor(ui): dashboard review queue uses useLazyFetch and links to post editor"
```

---

## Task 13: Hapus File Lama

**Files:**
- Delete: `app/pages/admin/review/index.vue`
- Delete: `app/pages/admin/review/[id].vue`
- Delete: `app/pages/dashboard/review/[id].vue`
- Delete: `app/components/dashboard/ReviewNoteEditor.vue`

- [ ] **Step 1: Hapus file-file lama**

```bash
rm app/pages/admin/review/index.vue
rm app/pages/admin/review/[id].vue
rm app/pages/dashboard/review/[id].vue
rm app/components/dashboard/ReviewNoteEditor.vue
```

- [ ] **Step 2: Verifikasi tidak ada import yang tersisa**

```bash
grep -r "DashboardReviewNoteEditor\|/admin/review\|dashboard/review/\[id\]" app/ --include="*.vue" --include="*.ts" | grep -v ".vue:.*to: '/dashboard/review'"
```

Hasil harus kosong (kecuali referensi ke `/dashboard/review` yang masih valid untuk halaman antrian review).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(cleanup): remove admin review pages and old ReviewNoteEditor component"
```

---

## Verification Checklist

Setelah semua task selesai, verifikasi manual:

- [ ] Santri membuka post draft → Simpan Draft + Kirim Artikel, tidak ada ReviewNoteEditor
- [ ] Santri membuka post pending_review → redirect ke /dashboard/posts
- [ ] Reviewer membuka `/dashboard/review` → list antrian, "Buka" → `/dashboard/posts/${id}/edit`
- [ ] Reviewer membuka post orang lain → Tolak + Publish + ReviewNoteEditor tampil di sidebar kanan
- [ ] Reviewer membuka post sendiri → Simpan Draft + Kirim Artikel (isOwnPost = true)
- [ ] Klik "Tolak" tanpa isi reviewNote → toast warning, tidak submit
- [ ] Klik "Publish" → approve, redirect ke /admin/posts
- [ ] Admin membuka `/admin/posts` → tabel dengan tombol edit (pencil) + trash di setiap baris
- [ ] Admin klik Edit → /admin/posts/${id}/edit → PostEditor dengan Tolak + Publish (jika bukan own post)
- [ ] Admin klik trash → modal konfirmasi → hapus → baris hilang
- [ ] Nav admin tidak tampilkan "Review Artikel"
- [ ] `/admin/review` → 404
- [ ] SantriPostEditor di `/dashboard/posts/new` dan `/dashboard/posts/${id}/edit` tetap berfungsi
