# Editorial Content Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full editorial flow from santri submission to reviewer/admin approval, including review queue UI and email notifications.

**Architecture:** API-first approach — schema changes and all server endpoints are built before any UI. The review flow follows WordPress-style single-level review: `draft → pending_review → published | rejected`. Reviewer and admin roles can approve or reject; rejected articles return to the author for revision.

**Tech Stack:** Nuxt 4, Nuxt UI, Drizzle ORM, MySQL (NuxtHub), Brevo REST API (email), TipTap (rich text editor).

**Spec:** `docs/superpowers/specs/2026-05-06-editorial-flow-design.md`

---

## File Map

**Modify:**
- `server/db/schema.ts` — rename `rejectionNote` → `reviewNote` (longtext), add `reviewedBy` FK
- `server/utils/santriPostEditor.ts` — update column refs from `rejectionNote` → `reviewNote`
- `server/utils/validation.ts` — add `validateRejectBody`, `validateReviewQueueQuery`, `validateAdminPostsQuery`
- `server/api/dashboard/santri/posts/[id]/submit.post.ts` — `rejectionNote: null` → `reviewNote: null`
- `server/api/dashboard/santri/posts/[id].get.ts` — join reviewer user, return `reviewedBy: { id, name } | null`
- `server/api/dashboard/stats.get.ts` — `rejectionNote` → `reviewNote` in column selection
- `app/components/dashboard/SantriPostEditor.vue` — rename `rejectionNote` ref/type, show reviewer name
- `app/pages/dashboard/posts/index.vue` — rename `rejectionNote` → `reviewNote` in `PostRow` type
- `app/pages/dashboard/review/index.vue` — replace placeholder with reviewer queue
- `app/pages/admin/posts/index.vue` — replace placeholder with all-posts view

**Create:**
- `server/api/dashboard/review/queue.get.ts` — list pending_review posts
- `server/api/dashboard/review/[id].get.ts` — get single pending post for review
- `server/api/dashboard/review/[id]/approve.post.ts` — publish post + send email
- `server/api/dashboard/review/[id]/reject.post.ts` — reject post with note + send email
- `server/api/admin/posts.get.ts` — list all posts across all authors
- `app/components/dashboard/ReviewNoteEditor.vue` — simplified TipTap editor (B/I/U/S, lists, link)
- `app/pages/dashboard/review/[id].vue` — review detail page

---

## Task 1: Schema — Rename `rejectionNote` → `reviewNote`, Add `reviewedBy`

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Update the `posts` table definition**

In `server/db/schema.ts`, replace the `posts` table definition. Change `rejectionNote: text()` to `reviewNote: longtext()`, and add `reviewedBy` after `authorId`:

```typescript
export const posts = mysqlTable('posts', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  content: longtext().notNull(),
  excerpt: text(),
  featuredImage: varchar({ length: 500 }),
  categoryId: int().references(() => categories.id),
  authorId: int().notNull().references(() => users.id),
  reviewedBy: int().references(() => users.id),
  status: mysqlEnum(['draft', 'pending_review', 'published', 'rejected']).notNull().default('draft'),
  reviewNote: longtext(),
  publishedAt: timestamp(),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
```

- [ ] **Step 2: Update `postsRelations` to add the `reviewer` relation**

In the same file, update `postsRelations`:

```typescript
export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
    relationName: 'authoredPosts',
  }),
  reviewer: one(users, {
    fields: [posts.reviewedBy],
    references: [users.id],
    relationName: 'reviewedPosts',
  }),
  postTags: many(postTags),
}))
```

Also update `usersRelations` to declare both sides:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts, { relationName: 'authoredPosts' }),
  reviewedPosts: many(posts, { relationName: 'reviewedPosts' }),
}))
```

- [ ] **Step 3: Generate migration**

```bash
pnpm nuxt db generate
```

Expected: a new file created in `server/db/migrations/mysql/` containing `ALTER TABLE posts RENAME COLUMN rejection_note TO review_note`, `ALTER TABLE posts MODIFY COLUMN review_note LONGTEXT`, and `ALTER TABLE posts ADD COLUMN reviewed_by INT`.

- [ ] **Step 4: Apply migration**

```bash
pnpm nuxt db migrate
```

Expected: `Migration applied successfully` (requires `MYSQL_URL` in `.env`).

- [ ] **Step 5: Commit**

```bash
git add server/db/schema.ts server/db/migrations/
git commit -m "feat(schema): rename rejectionNote to reviewNote (longtext), add reviewedBy FK"
```

---

## Task 2: Update Existing `rejectionNote` References

**Files:**
- Modify: `server/utils/santriPostEditor.ts`
- Modify: `server/api/dashboard/santri/posts/[id]/submit.post.ts`
- Modify: `server/api/dashboard/stats.get.ts`
- Modify: `app/pages/dashboard/posts/index.vue`

- [ ] **Step 1: Update `getSantriOwnedPost` in `server/utils/santriPostEditor.ts`**

The function returns columns including `rejectionNote`. Change to `reviewNote`. Also update the return type comment at line ~152:

```typescript
export async function getSantriOwnedPost(db: Database, postId: number, authorId: number) {
  const post = await db.query.posts.findFirst({
    where: and(eq(schema.posts.id, postId), eq(schema.posts.authorId, authorId)),
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
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  return post
}
```

- [ ] **Step 2: Update `submit.post.ts`**

In `server/api/dashboard/santri/posts/[id]/submit.post.ts`, change `rejectionNote: null` to `reviewNote: null` in the `.set({})` call:

```typescript
await db.update(schema.posts)
  .set({
    title: payload.title,
    slug: existing.slug,
    content: payload.content,
    excerpt: payload.excerpt,
    featuredImage: payload.featuredImage,
    categoryId: payload.categoryId,
    status: 'pending_review',
    reviewNote: null,
  })
  .where(eq(schema.posts.id, existing.id))
```

- [ ] **Step 3: Update `stats.get.ts`**

In `server/api/dashboard/stats.get.ts`, change `rejectionNote: true` → `reviewNote: true` in the `recentPosts` query columns (line ~57):

```typescript
db.query.posts.findMany({
  where: eq(schema.posts.authorId, user.id),
  orderBy: [desc(schema.posts.createdAt)],
  limit: 5,
  columns: { id: true, title: true, slug: true, status: true, reviewNote: true, createdAt: true },
}),
```

- [ ] **Step 4: Update `PostRow` type in `app/pages/dashboard/posts/index.vue`**

Find the `PostRow` type near the top of the `<script setup>` block and rename the field:

```typescript
type PostRow = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  categoryName: string | null;
  categoryType: "berita" | "pena_santri" | null;
};
```

- [ ] **Step 5: Commit**

```bash
git add server/utils/santriPostEditor.ts \
        server/api/dashboard/santri/posts/\[id\]/submit.post.ts \
        server/api/dashboard/stats.get.ts \
        "app/pages/dashboard/posts/index.vue"
git commit -m "refactor: rename rejectionNote → reviewNote in all existing references"
```

---

## Task 3: Add Validation Helpers

**Files:**
- Modify: `server/utils/validation.ts`

- [ ] **Step 1: Add `validateRejectBody` at the end of the file**

```typescript
export function validateRejectBody(value: unknown) {
  const body = getRequiredRecord(value)
  const reviewNote = getOptionalString(body.reviewNote)

  if (!reviewNote) {
    throw createError({ statusCode: 400, message: 'Catatan review wajib diisi saat menolak artikel.' })
  }

  return { reviewNote }
}
```

- [ ] **Step 2: Add `validateReviewQueueQuery`**

```typescript
export function validateReviewQueueQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')

  return {
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 10, { max: 50 }),
  }
}
```

- [ ] **Step 3: Add `validateAdminPostsQuery`**

```typescript
export function validateAdminPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const status = getOptionalString(query.status)

  return {
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 10, { max: 100 }),
    status: status && VALID_SANTRI_POST_STATUSES.includes(status as PostStatus)
      ? status as PostStatus
      : undefined,
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add server/utils/validation.ts
git commit -m "feat(validation): add validateRejectBody, validateReviewQueueQuery, validateAdminPostsQuery"
```

---

## Task 4: Review Queue & Detail API

**Files:**
- Create: `server/api/dashboard/review/queue.get.ts`
- Create: `server/api/dashboard/review/[id].get.ts`

- [ ] **Step 1: Create `server/api/dashboard/review/queue.get.ts`**

```typescript
import { count, desc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateReviewQueueQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireReviewer(event)
  const query = await getValidatedQuery(event, validateReviewQueueQuery)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)
  const offset = (query.page - 1) * query.limit

  const [posts, totalResult] = await Promise.all([
    db.query.posts.findMany({
      where: eq(schema.posts.status, 'pending_review'),
      orderBy: [desc(schema.posts.updatedAt)],
      limit: query.limit,
      offset,
      columns: { id: true, title: true, slug: true, updatedAt: true },
      with: {
        author: { columns: { id: true, name: true } },
        category: { columns: { id: true, name: true, type: true } },
      },
    }),
    db.select({ count: count() })
      .from(schema.posts)
      .where(eq(schema.posts.status, 'pending_review')),
  ])

  return {
    data: posts,
    total: totalResult[0]?.count ?? 0,
    page: query.page,
    limit: query.limit,
  }
})
```

- [ ] **Step 2: Create `server/api/dashboard/review/[id].get.ts`**

```typescript
import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const [post, tagRows] = await Promise.all([
    db.query.posts.findFirst({
      where: and(
        eq(schema.posts.id, postId),
        eq(schema.posts.status, 'pending_review'),
      ),
      columns: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        status: true,
        updatedAt: true,
      },
      with: {
        author: { columns: { id: true, name: true, email: true } },
        category: { columns: { id: true, name: true, type: true } },
      },
    }),
    db.select({ name: schema.tags.name })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(eq(schema.postTags.postId, postId)),
  ])

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan atau bukan dalam status pending review.' })
  }

  return {
    data: {
      ...post,
      tags: tagRows.map(t => t.name),
    },
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add server/api/dashboard/review/
git commit -m "feat(api): add review queue and detail endpoints"
```

---

## Task 5: Approve & Reject API Endpoints

**Files:**
- Create: `server/api/dashboard/review/[id]/approve.post.ts`
- Create: `server/api/dashboard/review/[id]/reject.post.ts`

- [ ] **Step 1: Create `server/api/dashboard/review/[id]/approve.post.ts`**

```typescript
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

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

  await db.update(schema.posts)
    .set({ status: 'published', publishedAt: now, reviewedBy: reviewer.id })
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu telah dipublish — ${post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${post.title}</strong> telah disetujui dan dipublish oleh <strong>${reviewer.name}</strong>.</p>
      <p>Baca di: <a href="https://ojialanshori.com/post/${post.slug}">ojialanshori.com/post/${post.slug}</a></p>
      <p>Terimakasih sudah berkontribusi!</p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${post.title}" telah dipublish oleh ${reviewer.name}.\n\nhttps://ojialanshori.com/post/${post.slug}`,
  })

  return { id: postId, status: 'published' as const, publishedAt: now }
})
```

- [ ] **Step 2: Create `server/api/dashboard/review/[id]/reject.post.ts`**

```typescript
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRejectBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const { reviewNote } = await readValidatedBody(event, validateRejectBody)

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

  await db.update(schema.posts)
    .set({ status: 'rejected', reviewNote, reviewedBy: reviewer.id })
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu membutuhkan revisi — ${post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${post.title}</strong> membutuhkan beberapa revisi sebelum bisa dipublish.</p>
      <p><strong>Catatan dari ${reviewer.name}:</strong></p>
      <div style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;">${reviewNote}</div>
      <p><a href="https://ojialanshori.com/dashboard/posts/${post.id}/edit">Edit Artikel</a></p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${post.title}" membutuhkan revisi.\n\nEdit di: https://ojialanshori.com/dashboard/posts/${post.id}/edit`,
  })

  return { id: postId, status: 'rejected' as const }
})
```

- [ ] **Step 3: Commit**

```bash
git add "server/api/dashboard/review/[id]/"
git commit -m "feat(api): add approve and reject endpoints with email notifications"
```

---

## Task 6: Admin All-Posts API

**Files:**
- Create: `server/api/admin/posts.get.ts`

- [ ] **Step 1: Create `server/api/admin/posts.get.ts`**

```typescript
import { count, desc, eq } from 'drizzle-orm'

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
  const offset = (query.page - 1) * query.limit
  const whereClause = query.status ? eq(schema.posts.status, query.status) : undefined

  const [posts, totalResult] = await Promise.all([
    db.query.posts.findMany({
      where: whereClause,
      orderBy: [desc(schema.posts.updatedAt)],
      limit: query.limit,
      offset,
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
    }),
    db.select({ count: count() }).from(schema.posts).where(whereClause),
  ])

  return {
    data: posts,
    total: totalResult[0]?.count ?? 0,
    page: query.page,
    limit: query.limit,
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/admin/posts.get.ts
git commit -m "feat(api): add admin all-posts endpoint"
```

---

## Task 7: Update Santri Post Detail to Return Reviewer Name

**Files:**
- Modify: `server/api/dashboard/santri/posts/[id].get.ts`

- [ ] **Step 1: Join reviewer user in the query**

The current `getSantriOwnedPost` helper doesn't join the reviewer. We need to do an additional query for the reviewer name. Replace the current handler with:

```typescript
import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { getSantriOwnedPost } from '#server/utils/santriPostEditor'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const [post, tagRows] = await Promise.all([
    db.query.posts.findFirst({
      where: and(eq(schema.posts.id, postId), eq(schema.posts.authorId, currentUser.id)),
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
      },
      with: {
        reviewer: { columns: { id: true, name: true } },
      },
    }),
    db
      .select({ name: schema.tags.name })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .innerJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
      .where(and(eq(schema.postTags.postId, postId), eq(schema.posts.authorId, currentUser.id))),
  ])

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  return {
    data: {
      ...post,
      tags: tagRows.map(tag => tag.name),
    },
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/dashboard/santri/posts/[id].get.ts"
git commit -m "feat(api): include reviewer name in santri post detail response"
```

---

## Task 8: `ReviewNoteEditor` Component (Simplified TipTap)

**Files:**
- Create: `app/components/dashboard/ReviewNoteEditor.vue`

- [ ] **Step 1: Create the component**

This is a simplified TipTap editor with only Bold, Italic, Underline, Strikethrough, Bullet List, Ordered List, and Link. It uses `UEditor` from Nuxt UI with a minimal toolbar config.

Before writing, check the current Nuxt UI UEditor component API:
```
mcp__nuxt-ui__get-component with name "Editor"
```

- [ ] **Step 2: Write `app/components/dashboard/ReviewNoteEditor.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toolbarItems = [
  [
    { kind: 'bold' as const, icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'italic' as const, icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'underline' as const, icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'strike' as const, icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
  ],
  [
    { kind: 'bulletList' as const, icon: 'i-lucide-list', tooltip: { text: 'Bullet List' } },
    { kind: 'orderedList' as const, icon: 'i-lucide-list-ordered', tooltip: { text: 'Numbered List' } },
  ],
  [
    { kind: 'link' as const, icon: 'i-lucide-link', tooltip: { text: 'Link' } },
  ],
]
</script>

<template>
  <UEditor
    :model-value="modelValue"
    :toolbar="{ items: toolbarItems }"
    :disabled="disabled"
    class="min-h-32"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/ReviewNoteEditor.vue
git commit -m "feat(ui): add ReviewNoteEditor simplified TipTap component"
```

---

## Task 9: Reviewer Queue Page

**Files:**
- Modify: `app/pages/dashboard/review/index.vue`

- [ ] **Step 1: Replace placeholder with real queue**

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'reviewer',
})

type QueuePost = {
  id: number
  title: string
  slug: string
  updatedAt: string
  author: { id: number; name: string }
  category: { id: number; name: string; type: 'berita' | 'pena_santri' } | null
}

type QueueResponse = {
  data: QueuePost[]
  total: number
  page: number
  limit: number
}

const PAGE_SIZE = 10
const page = ref(1)

const { data, status, refresh } = await useFetch<QueueResponse>(
  '/api/dashboard/review/queue',
  {
    key: 'dashboard-review-queue',
    query: { page, limit: PAGE_SIZE },
    watch: [page],
  },
)

const posts = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<QueuePost>[] = [
  {
    key: 'title',
    label: 'Judul',
    cell: ({ row }) =>
      h('span', { class: 'font-medium line-clamp-2' }, row.original.title),
  },
  {
    key: 'author',
    label: 'Penulis',
    cell: ({ row }) => h('span', {}, row.original.author.name),
  },
  {
    key: 'category',
    label: 'Kategori',
    cell: ({ row }) => row.original.category
      ? h(UBadge, {
          label: row.original.category.name,
          color: row.original.category.type === 'berita' ? 'info' : 'secondary',
          variant: 'subtle',
        })
      : h('span', { class: 'text-muted' }, '—'),
  },
  {
    key: 'updatedAt',
    label: 'Dikirim',
    cell: ({ row }) =>
      h('span', { class: 'text-muted text-sm' },
        new Date(row.original.updatedAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      ),
  },
  {
    key: 'actions',
    label: '',
    cell: ({ row }) =>
      h(UButton, {
        label: 'Buka',
        size: 'sm',
        color: 'primary',
        variant: 'outline',
        to: `/dashboard/review/${row.original.id}`,
      }),
  },
]
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
      :data="posts"
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

- [ ] **Step 2: Commit**

```bash
git add "app/pages/dashboard/review/index.vue"
git commit -m "feat(ui): implement reviewer queue page"
```

---

## Task 10: Review Detail Page

**Files:**
- Create: `app/pages/dashboard/review/[id].vue`

- [ ] **Step 1: Create the review detail page**

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'reviewer',
})

type ReviewPost = {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  status: 'pending_review'
  updatedAt: string
  tags: string[]
  author: { id: number; name: string; email: string }
  category: { id: number; name: string; type: 'berita' | 'pena_santri' } | null
}

const route = useRoute()
const postId = Number(route.params.id)
const toast = useToast()
const router = useRouter()

const { data, status: fetchStatus } = await useFetch<{ data: ReviewPost }>(
  `/api/dashboard/review/${postId}`,
  { key: `review-detail-${postId}` },
)

const post = computed(() => data.value?.data ?? null)

const reviewNote = ref('')
const submitting = ref<'approve' | 'reject' | null>(null)

async function approve() {
  submitting.value = 'approve'
  try {
    await $fetch(`/api/dashboard/review/${postId}/approve`, { method: 'POST' })
    toast.add({ title: 'Artikel dipublish', color: 'success', icon: 'i-lucide-check-circle' })
    await router.push('/dashboard/review')
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal publish', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    submitting.value = null
  }
}

async function reject() {
  if (!reviewNote.value.trim()) {
    toast.add({ title: 'Catatan review wajib diisi', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  submitting.value = 'reject'
  try {
    await $fetch(`/api/dashboard/review/${postId}/reject`, {
      method: 'POST',
      body: { reviewNote: reviewNote.value },
    })
    toast.add({ title: 'Artikel ditolak', color: 'warning', icon: 'i-lucide-x-circle' })
    await router.push('/dashboard/review')
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal tolak', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  }
  finally {
    submitting.value = null
  }
}
</script>

<template>
  <div v-if="fetchStatus === 'pending'" class="p-6">
    <USkeleton class="h-8 w-64 mb-4" />
    <USkeleton class="h-96 w-full" />
  </div>

  <div v-else-if="!post" class="p-6">
    <UAlert
      color="error"
      icon="i-lucide-alert-circle"
      title="Post tidak ditemukan"
      description="Post tidak ditemukan atau bukan dalam status pending review."
    />
  </div>

  <div v-else class="p-6 flex gap-6 items-start">
    <!-- Main article preview -->
    <div class="flex-1 min-w-0 space-y-6">
      <div>
        <UButton
          to="/dashboard/review"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Kembali ke Antrian"
          class="-ml-2 mb-4"
        />
        <h1 class="text-2xl font-bold">{{ post.title }}</h1>
        <div class="flex items-center gap-3 mt-2 text-sm text-muted">
          <span>{{ post.author.name }}</span>
          <span>·</span>
          <span v-if="post.category">{{ post.category.name }}</span>
          <span>·</span>
          <span>{{ new Date(post.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
        </div>
        <div v-if="post.tags.length" class="flex flex-wrap gap-1.5 mt-3">
          <UBadge
            v-for="tag in post.tags"
            :key="tag"
            :label="tag"
            variant="subtle"
            color="neutral"
          />
        </div>
      </div>

      <img
        v-if="post.featuredImage"
        :src="post.featuredImage"
        :alt="post.title"
        class="w-full rounded-lg object-cover max-h-80"
      />

      <div
        class="prose prose-sm max-w-none"
        v-html="post.content"
      />
    </div>

    <!-- Sidebar -->
    <div class="w-80 shrink-0 space-y-4 sticky top-6">
      <UCard>
        <template #header>
          <p class="font-medium text-sm">Info Artikel</p>
        </template>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted">Penulis</dt>
            <dd>{{ post.author.name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted">Email</dt>
            <dd class="truncate ml-4">{{ post.author.email }}</dd>
          </div>
          <div v-if="post.category" class="flex justify-between">
            <dt class="text-muted">Kategori</dt>
            <dd>{{ post.category.name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted">Dikirim</dt>
            <dd>{{ new Date(post.updatedAt).toLocaleDateString('id-ID') }}</dd>
          </div>
        </dl>
      </UCard>

      <UCard>
        <template #header>
          <p class="font-medium text-sm">Catatan Review</p>
        </template>
        <div class="space-y-3">
          <p class="text-sm text-muted">Wajib diisi saat menolak artikel.</p>
          <DashboardReviewNoteEditor v-model="reviewNote" :disabled="!!submitting" />
        </div>
      </UCard>

      <div class="flex flex-col gap-2">
        <UButton
          label="Publish Artikel"
          color="success"
          icon="i-lucide-check"
          block
          :loading="submitting === 'approve'"
          :disabled="!!submitting"
          @click="approve"
        />
        <UButton
          label="Tolak Artikel"
          color="error"
          variant="outline"
          icon="i-lucide-x"
          block
          :loading="submitting === 'reject'"
          :disabled="!!submitting"
          @click="reject"
        />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add "app/pages/dashboard/review/[id].vue"
git commit -m "feat(ui): add review detail page with approve/reject actions"
```

---

## Task 11: Admin All-Posts Page

**Files:**
- Modify: `app/pages/admin/posts/index.vue`

- [ ] **Step 1: Replace placeholder**

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

type AdminPost = {
  id: number
  title: string
  slug: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  updatedAt: string
  publishedAt: string | null
  author: { id: number; name: string }
  category: { id: number; name: string; type: 'berita' | 'pena_santri' } | null
}

type AdminPostsResponse = {
  data: AdminPost[]
  total: number
  page: number
  limit: number
}

const STATUS_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Terbit', value: 'published' },
  { label: 'Dalam Review', value: 'pending_review' },
  { label: 'Draft', value: 'draft' },
  { label: 'Ditolak', value: 'rejected' },
]

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  published: 'success',
  pending_review: 'warning',
  draft: 'neutral',
  rejected: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Terbit',
  pending_review: 'Dalam Review',
  draft: 'Draft',
  rejected: 'Ditolak',
}

const PAGE_SIZE = 10
const page = ref(1)
const statusFilter = ref('')

watch(statusFilter, () => { page.value = 1 })

const { data, status } = await useFetch<AdminPostsResponse>(
  '/api/admin/posts',
  {
    key: 'admin-posts',
    query: computed(() => ({
      page: page.value,
      limit: PAGE_SIZE,
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
    })),
    watch: [page, statusFilter],
  },
)

const posts = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)

const UBadge = resolveComponent('UBadge')

const columns: TableColumn<AdminPost>[] = [
  {
    key: 'title',
    label: 'Judul',
    cell: ({ row }) => h('span', { class: 'font-medium line-clamp-2' }, row.original.title),
  },
  {
    key: 'author',
    label: 'Penulis',
    cell: ({ row }) => h('span', {}, row.original.author.name),
  },
  {
    key: 'status',
    label: 'Status',
    cell: ({ row }) => h(UBadge, {
      label: STATUS_LABEL[row.original.status] ?? row.original.status,
      color: STATUS_COLOR[row.original.status] ?? 'neutral',
      variant: 'subtle',
    }),
  },
  {
    key: 'category',
    label: 'Kategori',
    cell: ({ row }) => row.original.category
      ? h('span', {}, row.original.category.name)
      : h('span', { class: 'text-muted' }, '—'),
  },
  {
    key: 'updatedAt',
    label: 'Diperbarui',
    cell: ({ row }) => h('span', { class: 'text-muted text-sm' },
      new Date(row.original.updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    ),
  },
]
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Semua Artikel</h1>
        <p class="text-muted text-sm mt-1">Seluruh artikel dari semua penulis.</p>
      </div>
      <USelect
        v-model="statusFilter"
        :items="STATUS_OPTIONS"
        value-key="value"
        label-key="label"
        class="w-44"
      />
    </div>

    <UTable
      :data="posts"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #empty>
        <div class="py-12 text-center">
          <p class="text-muted">Tidak ada artikel ditemukan.</p>
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

- [ ] **Step 2: Commit**

```bash
git add "app/pages/admin/posts/index.vue"
git commit -m "feat(ui): implement admin all-posts page"
```

---

## Task 12: Update `SantriPostEditor` — Show `reviewNote` and Reviewer Name

**Files:**
- Modify: `app/components/dashboard/SantriPostEditor.vue`

- [ ] **Step 1: Update the `EditorPost` type**

Find the `EditorPost` type near the top of `<script setup>` and replace:

```typescript
type EditorPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: "draft" | "pending_review" | "published" | "rejected";
  reviewNote: string | null;
  reviewer: { id: number; name: string } | null;
  tags: string[];
};
```

- [ ] **Step 2: Update the reactive ref from `rejectionNote` to `reviewNote` + add `reviewer`**

Find:
```typescript
const rejectionNote = ref<string | null>(null);
```

Replace with:
```typescript
const reviewNote = ref<string | null>(null);
const reviewerName = ref<string | null>(null);
```

- [ ] **Step 3: Update the `watch(postData, ...)` block**

Find the lines:
```typescript
rejectionNote.value = post.rejectionNote;
```

Replace with:
```typescript
reviewNote.value = post.reviewNote;
reviewerName.value = post.reviewer?.name ?? null;
```

- [ ] **Step 4: Update the template — rejection alert in the sidebar**

Find where `rejectionNote` is rendered in the template (typically in the sidebar as a `UAlert` or similar block). Replace plain-text rendering with HTML rendering and add reviewer name. The exact location depends on the template — search for `rejectionNote` in the template section and replace with:

```vue
<UAlert
  v-if="currentStatus === 'rejected'"
  color="error"
  variant="subtle"
  icon="i-lucide-message-square-warning"
  title="Artikel ditolak"
>
  <template #description>
    <p v-if="reviewerName" class="text-sm text-muted mb-2">
      Direview oleh: <strong>{{ reviewerName }}</strong>
    </p>
    <div
      v-if="reviewNote"
      class="prose prose-sm max-w-none"
      v-html="reviewNote"
    />
  </template>
</UAlert>
```

- [ ] **Step 5: Commit**

```bash
git add app/components/dashboard/SantriPostEditor.vue
git commit -m "feat(ui): update SantriPostEditor to show reviewNote HTML and reviewer name"
```

---

## Final Verification Checklist

- [ ] `pnpm build` completes without TypeScript errors
- [ ] Santri can submit article → status changes to `pending_review`
- [ ] Reviewer can see submitted article in `/dashboard/review`
- [ ] Reviewer can open article and see full content in `/dashboard/review/[id]`
- [ ] Reviewer can approve → status becomes `published`, email sent to santri
- [ ] Reviewer can reject with note → status becomes `rejected`, email sent with note
- [ ] Santri can see rejection note (rendered HTML) and reviewer name on edit page
- [ ] Santri can resubmit rejected article → `reviewNote` cleared, status back to `pending_review`
- [ ] Admin can see all articles at `/admin/posts` with status filter
- [ ] Admin can filter by status and paginate
