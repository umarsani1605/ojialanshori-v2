# Backend Domain and Role Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Nuxt fullstack backend and related role-sensitive frontend wiring so the project uses fixed business roles (`admin`, `reviewer`, `santri`), domain-first backend grouping, thin handlers, and consistent `route -> service -> repo` structure without compatibility layers.

**Architecture:** Backend code moves from mixed role/UI namespaces and inline-Drizzle handlers to domain-oriented modules under `server/api`, `server/services`, and `server/repositories`. Role-sensitive business decisions are centralized in small domain policy helpers, while UI cluster behavior is aligned to the fixed business role model: `admin` remains the operational cluster, `reviewer` and `santri` share `/dashboard`, and editorial permissions are enforced by business rules instead of route naming.
Service and repository modules are grouped per domain, with multiple named exports in each file rather than one file per action.

**Tech Stack:** Nuxt 4, Nitro/h3 server routes, Drizzle ORM with MySQL, Nuxt Auth Utils, Vitest, Vue 3, Nuxt UI.

---

## File Structure

### Backend modules to create

**Files:**
- Create: `server/services/posts/postService.ts`
- Create: `server/repositories/posts/postRepository.ts`
- Create: `server/repositories/posts/postTagRepository.ts`
- Create: `server/policies/posts.ts`
- Create: `server/services/users/userService.ts`
- Create: `server/repositories/users/userRepository.ts`
- Create: `server/policies/users.ts`
- Create: `server/services/profile/profileService.ts`
- Create: `server/repositories/profile/profileRepository.ts`
- Create: `server/services/auth/authService.ts`
- Create: `server/repositories/auth/authRepository.ts`
- Create: `server/services/categories/categoryService.ts`
- Create: `server/repositories/categories/categoryRepository.ts`
- Create: `server/services/gallery/galleryService.ts`
- Create: `server/repositories/gallery/galleryRepository.ts`
- Create: `server/services/banners/bannerService.ts`
- Create: `server/repositories/banners/bannerRepository.ts`
- Create: `server/services/pages/pageService.ts`
- Create: `server/repositories/pages/pageRepository.ts`
- Create: `server/services/settings/settingService.ts`
- Create: `server/repositories/settings/settingRepository.ts`
- Create: `server/services/public/publicContentService.ts`
- Create: `server/repositories/public/publicContentRepository.ts`

### Backend routes to create or rename

**Files:**
- Create: `server/api/posts/index.get.ts`
- Create: `server/api/posts/index.post.ts`
- Create: `server/api/posts/[id].get.ts`
- Create: `server/api/posts/[id].patch.ts`
- Create: `server/api/posts/[id].delete.ts`
- Create: `server/api/posts/[id]/submit.post.ts`
- Create: `server/api/posts/[id]/approve.post.ts`
- Create: `server/api/posts/[id]/reject.post.ts`
- Create: `server/api/posts/[id]/publish.post.ts`

### Existing backend routes to migrate or remove

**Files:**
- Modify then delete usage of: `server/api/admin/posts.get.ts`
- Modify then delete usage of: `server/api/admin/posts/index.post.ts`
- Modify then delete usage of: `server/api/admin/posts/[id].get.ts`
- Modify then delete usage of: `server/api/admin/posts/[id].patch.ts`
- Modify then delete usage of: `server/api/admin/posts/[id].delete.ts`
- Modify then delete usage of: `server/api/admin/posts/[id]/publish.post.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/index.get.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/index.post.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/[id].get.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/[id].patch.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/[id].delete.ts`
- Modify then delete usage of: `server/api/dashboard/santri/posts/[id]/submit.post.ts`
- Modify then delete usage of: `server/api/dashboard/review/queue.get.ts`
- Modify then delete usage of: `server/api/dashboard/review/[id].get.ts`
- Modify then delete usage of: `server/api/dashboard/review/[id]/approve.post.ts`
- Modify then delete usage of: `server/api/dashboard/review/[id]/reject.post.ts`

### Frontend role and routing files to modify

**Files:**
- Modify: `app/composables/useAuth.ts`
- Modify: `app/utils/roleRoute.ts`
- Modify: `app/middleware/role.ts`
- Modify: `app/layouts/admin.vue`
- Modify: `app/layouts/dashboard-santri.vue`
- Modify: `app/composables/usePostEditor.ts`
- Modify: `app/pages/admin/berita/index.vue`
- Modify: `app/pages/admin/berita/create.vue`
- Modify: `app/pages/admin/berita/[id]/edit.vue`
- Modify: `app/pages/admin/pena-santri/index.vue`
- Modify: `app/pages/admin/pena-santri/create.vue`
- Modify: `app/pages/admin/pena-santri/[id]/edit.vue`
- Modify or replace: `app/pages/dashboard/review/index.vue`
- Modify: `app/pages/dashboard/posts/index.vue`
- Modify: `app/pages/dashboard/posts/create.vue`
- Modify: `app/pages/dashboard/posts/[id]/edit.vue`
- Modify: `app/pages/admin/posts/index.vue`

### Validation and support files to modify

**Files:**
- Modify: `server/utils/guard.ts`
- Modify: `server/utils/validation.ts`
- Modify: `server/utils/santriPostEditor.ts`
- Modify: `server/api/dashboard/stats.get.ts`
- Modify: `server/api/dashboard/santri/stats.get.ts`
- Modify: `server/db/schema.ts` only if role enum or post fields need alignment

### Tests to create or rewrite after refactor

**Files:**
- Create: `tests/server/posts-route.test.ts`
- Create: `tests/server/posts-policy.test.ts`
- Create: `tests/server/users-route.test.ts` (rewrite existing target if needed)
- Create: `tests/server/profile-route.test.ts`
- Create: `tests/server/auth-route.test.ts`
- Create: `tests/server/categories-route.test.ts`
- Create: `tests/server/gallery-route.test.ts`
- Create: `tests/server/banners-route.test.ts`
- Create: `tests/server/pages-route.test.ts`
- Create: `tests/server/settings-route.test.ts`
- Create: `tests/server/public-content-route.test.ts`
- Modify: `tests/composables/useAuth.test.ts`
- Modify: `tests/middleware/role.test.ts`
- Modify or replace: `tests/components/santri-post-editor.test.ts`
- Modify: `tests/components/post-editor.test.ts`

## Task 1: Freeze Role and Access Rules

**Files:**
- Modify: `app/composables/useAuth.ts`
- Modify: `app/utils/roleRoute.ts`
- Modify: `app/middleware/role.ts`
- Modify: `server/utils/guard.ts`
- Create: `server/policies/posts.ts`
- Create: `server/policies/users.ts`

- [ ] **Step 1: Align frontend role helpers to the fixed role set**

Update `app/utils/roleRoute.ts` so only `admin` maps to the admin cluster and both `reviewer` and `santri` map to the dashboard cluster.

```ts
export type AppRole = 'admin' | 'reviewer' | 'santri'
export type AppCluster = 'admin' | 'dashboard'

const ADMIN_ROLES: AppRole[] = ['admin']
const DASHBOARD_ROLES: AppRole[] = ['reviewer', 'santri']
```

- [ ] **Step 2: Update `useAuth()` capabilities to match business meaning**

Modify `app/composables/useAuth.ts` so capabilities are explicit and not overloaded by route naming.

```ts
isAdmin: computed(() => user.value?.role === 'admin'),
isReviewer: computed(() => user.value?.role === 'reviewer'),
isSantri: computed(() => user.value?.role === 'santri'),
canReview: computed(() => ['admin', 'reviewer'].includes(user.value?.role ?? '')),
canWritePenaSantri: computed(() => user.value?.role === 'santri'),
canManageBerita: computed(() => user.value?.role === 'admin'),
```

- [ ] **Step 3: Replace cluster-only route middleware checks with role-intent checks**

Adjust `app/middleware/role.ts` so `/admin/**` remains admin-only and `/dashboard/**` remains reviewer/santri.

```ts
if (to.path.startsWith('/admin') && !auth.isAdmin.value)
  return navigateTo(auth.homePath.value)

if (to.path.startsWith('/dashboard') && auth.isAdmin.value)
  return navigateTo(auth.homePath.value)
```

- [ ] **Step 4: Keep server guard primitives simple**

Retain `requireAuth`, `requireReviewer`, and `requireAdmin` in `server/utils/guard.ts`, but ensure the type only exposes `admin | reviewer | santri` and remove any dead assumptions about other roles.

```ts
export type Role = 'admin' | 'reviewer' | 'santri'
```

- [ ] **Step 5: Create post policy helpers**

Add `server/policies/posts.ts` with explicit decisions for create/edit/delete/submit/approve/reject/publish.

```ts
export function canCreatePost(role: Role, type: 'berita' | 'pena_santri') {
  if (type === 'berita') return role === 'admin'
  return role === 'santri'
}
```

```ts
export function canApprovePost(role: Role, type: 'berita' | 'pena_santri') {
  if (type === 'berita') return role === 'admin'
  return role === 'admin' || role === 'reviewer'
}
```

- [ ] **Step 6: Create user policy helpers**

Add `server/policies/users.ts` to centralize operational-domain permissions.

```ts
export function canManageUsers(role: Role) {
  return role === 'admin'
}
```

- [ ] **Step 7: Commit**

Run:

```bash
git add app/composables/useAuth.ts app/utils/roleRoute.ts app/middleware/role.ts server/utils/guard.ts server/policies/posts.ts server/policies/users.ts
git commit -m "refactor(auth): align fixed business roles and policies"
```

Expected: commit created with role and policy foundation only.

## Task 2: Build the Posts Repo Layer

**Files:**
- Create: `server/repositories/posts/postRepository.ts`
- Create: `server/repositories/posts/postTagRepository.ts`
- Modify: `server/utils/santriPostEditor.ts`

- [ ] **Step 1: Extract common post selects into one repo module**

Move repeated post-query shapes out of handlers and into repo functions.

```ts
export async function findPostById(db: Database, postId: number) {
  return db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    with: {
      author: { columns: { id: true, name: true, email: true } },
      category: { columns: { id: true, name: true, type: true } },
      reviewer: { columns: { id: true, name: true } },
    },
  })
}
```

- [ ] **Step 2: Extract list queries with no server pagination**

Create list repo functions that return complete relevant datasets for actor-facing screens.

```ts
export async function listAllPosts(db: Database) {
  return db.query.posts.findMany({
    orderBy: [desc(schema.posts.updatedAt)],
    with: {
      author: { columns: { id: true, name: true } },
      category: { columns: { id: true, name: true, type: true } },
    },
  })
}
```

```ts
export async function listOwnPenaSantriPosts(db: Database, authorId: number) {
  return db.query.posts.findMany({
    where: eq(schema.posts.authorId, authorId),
    orderBy: [desc(schema.posts.createdAt)],
  })
}
```

- [ ] **Step 3: Extract write-side repo helpers**

Create repo functions for insert/update/delete.

```ts
export async function insertPost(db: Database, values: typeof schema.posts.$inferInsert) {
  const result = await db.insert(schema.posts).values(values)
  return result[0].insertId
}
```

```ts
export async function updatePost(db: Database, postId: number, values: Partial<typeof schema.posts.$inferInsert>) {
  await db.update(schema.posts).set(values).where(eq(schema.posts.id, postId))
}
```

- [ ] **Step 4: Isolate tag persistence**

Move tag syncing and tag lookup into `server/repositories/posts/postTagRepository.ts`. Keep `server/utils/santriPostEditor.ts` focused on content payload parsing and category helpers only.

```ts
export async function syncPostTags(db: Database, postId: number, tags: string[]) {
  // move current sync logic here
}
```

- [ ] **Step 5: Keep `santriPostEditor` utility narrow**

Retain only helpers still needed by services, such as `parseSantriPostPayload`, `assertDraftPayload`, `assertSubmitPayload`, `ensureCategoryExists`, and `generateUniquePostSlug` if not yet extracted.

- [ ] **Step 6: Commit**

Run:

```bash
git add server/repositories/posts server/utils/santriPostEditor.ts
git commit -m "refactor(posts): extract post repository layer"
```

Expected: commit created with repo-only extraction.

## Task 3: Build the Posts Service Layer

**Files:**
- Create: `server/services/posts/postService.ts`

- [ ] **Step 1: Create actor-aware list functions**

Add `listPostsForActor()` and define one business entry point for list screens.

```ts
export async function listPostsForActor(db: Database, actor: { id: number; role: Role }) {
  if (actor.role === 'admin') return listAllPosts(db)
  if (actor.role === 'reviewer') return listPostsForReviewer(db)
  return listOwnPenaSantriPosts(db, actor.id)
}
```

- [ ] **Step 2: Create actor-aware get function**

Route all post detail access through one business entry point.

```ts
export async function getPostForActor(db: Database, actor: { id: number; role: Role }, postId: number) {
  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  assertCanViewPost(actor, post)
  return post
}
```

- [ ] **Step 3: Create create/update/delete functions**

Implement business ownership and type checks in service functions, not in routes.

```ts
export async function createPostForActor(db: Database, actor: Actor, payload: PostPayload) {
  if (!canCreatePost(actor.role, payload.type)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
}
```

- [ ] **Step 4: Create submit/approve/reject/publish functions**

Model workflow actions explicitly.

```ts
export async function submitPostForReview(db: Database, actor: Actor, postId: number, payload: PostPayload) {
  // santri own draft only
}
```

```ts
export async function approvePostForActor(db: Database, actor: Actor, postId: number, payload: ReviewPayload) {
  // admin/reviewer on pena_santri only
}
```

- [ ] **Step 5: Keep services free of request objects**

Services should accept `db`, `actor`, path params, and payloads explicitly. Do not pass `event` into post services.

- [ ] **Step 6: Commit**

Run:

```bash
git add server/services/posts
git commit -m "refactor(posts): add post service layer"
```

Expected: commit created with post business orchestration.

## Task 4: Replace Posts Routes with Domain-First Handlers

**Files:**
- Create: `server/api/posts/index.get.ts`
- Create: `server/api/posts/index.post.ts`
- Create: `server/api/posts/[id].get.ts`
- Create: `server/api/posts/[id].patch.ts`
- Create: `server/api/posts/[id].delete.ts`
- Create: `server/api/posts/[id]/submit.post.ts`
- Create: `server/api/posts/[id]/approve.post.ts`
- Create: `server/api/posts/[id]/reject.post.ts`
- Create: `server/api/posts/[id]/publish.post.ts`
- Modify then stop using: legacy post and review routes under `server/api/admin/**` and `server/api/dashboard/**`

- [ ] **Step 1: Create thin list and detail handlers**

Use validation + guard + `useDb(event)` + service call only.

```ts
export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  return { data: await listPostsForActor(useDb(event), actor) }
})
```

- [ ] **Step 2: Create thin mutation handlers**

Pattern for create:

```ts
export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const payload = await readValidatedBody(event, validatePostBody)
  return await createPostForActor(useDb(event), actor, payload)
})
```

- [ ] **Step 3: Create thin workflow handlers**

Pattern for approve:

```ts
export default defineEventHandler(async (event) => {
  const actor = requireReviewer(event)
  const { id } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateReviewActionBody)
  return await approvePostForActor(useDb(event), actor, id, payload)
})
```

- [ ] **Step 4: Switch frontend callers to `/api/posts/**`**

Update all `$fetch` and `useFetch` call sites in editor and list screens before deleting legacy routes.

- [ ] **Step 5: Remove legacy post route usage**

Delete old route files after all imports and callers have moved.

Run:

```bash
git rm server/api/admin/posts.get.ts server/api/admin/posts/index.post.ts server/api/admin/posts/[id].get.ts server/api/admin/posts/[id].patch.ts server/api/admin/posts/[id].delete.ts server/api/admin/posts/[id]/publish.post.ts
git rm server/api/dashboard/santri/posts/index.get.ts server/api/dashboard/santri/posts/index.post.ts server/api/dashboard/santri/posts/[id].get.ts server/api/dashboard/santri/posts/[id].patch.ts server/api/dashboard/santri/posts/[id].delete.ts server/api/dashboard/santri/posts/[id]/submit.post.ts
git rm server/api/dashboard/review/queue.get.ts server/api/dashboard/review/[id].get.ts server/api/dashboard/review/[id]/approve.post.ts server/api/dashboard/review/[id]/reject.post.ts
```

- [ ] **Step 6: Commit**

Run:

```bash
git add server/api/posts app/composables/usePostEditor.ts app/pages/admin/berita app/pages/admin/pena-santri app/pages/dashboard/posts app/pages/dashboard/review app/pages/admin/posts/index.vue
git commit -m "refactor(posts): replace role-based routes with domain-first handlers"
```

Expected: commit created with new domain-first `posts` API and caller updates.

## Task 5: Align Editorial UI to the Final Business Roles

**Files:**
- Modify: `app/layouts/admin.vue`
- Modify: `app/layouts/dashboard-santri.vue`
- Modify: `app/composables/usePostEditor.ts`
- Modify: `app/pages/admin/berita/index.vue`
- Modify: `app/pages/admin/berita/create.vue`
- Modify: `app/pages/admin/berita/[id]/edit.vue`
- Modify: `app/pages/admin/pena-santri/index.vue`
- Modify: `app/pages/admin/pena-santri/create.vue`
- Modify: `app/pages/admin/pena-santri/[id]/edit.vue`
- Modify or replace: `app/pages/dashboard/review/index.vue`
- Modify: `app/pages/dashboard/posts/index.vue`
- Modify: `app/pages/dashboard/posts/create.vue`
- Modify: `app/pages/dashboard/posts/[id]/edit.vue`

- [ ] **Step 1: Keep `berita` in the admin cluster only**

Admin pages remain the place for institutional content management.

- [ ] **Step 2: Move reviewer editorial access to dashboard surfaces**

Reviewer and santri share `/dashboard`, so reviewer-facing `pena_santri` listing and review actions should live under dashboard-facing pages or shared dashboard layout components, not under admin-only pages.

- [ ] **Step 3: Simplify `usePostEditor` around one posts API**

Replace route branching such as `/api/admin/posts` vs `/api/dashboard/santri/posts` with only `/api/posts` actions plus actor- and type-aware services.

```ts
response = await $fetch('/api/posts', {
  method: 'POST',
  body: payload,
})
```

- [ ] **Step 4: Ensure reviewer access mirrors business scope**

Reviewer should be able to:

- list `pena_santri` items to review
- open detail and review screens
- approve or reject

Reviewer should not be routed to operational admin pages.

- [ ] **Step 5: Commit**

Run:

```bash
git add app/layouts/admin.vue app/layouts/dashboard-santri.vue app/composables/usePostEditor.ts app/pages/admin app/pages/dashboard
git commit -m "refactor(frontend): align editorial UI to final business roles"
```

Expected: commit created with reviewer/santri dashboard alignment.

## Task 6: Refactor Users, Profile, and Auth into Domain Layers

**Files:**
- Create: `server/services/users/userService.ts`
- Create: `server/repositories/users/userRepository.ts`
- Create: `server/services/profile/profileService.ts`
- Create: `server/repositories/profile/profileRepository.ts`
- Create: `server/services/auth/authService.ts`
- Create: `server/repositories/auth/authRepository.ts`
- Modify: `server/api/dashboard/users/index.get.ts`
- Modify: `server/api/dashboard/users/index.post.ts`
- Modify: `server/api/dashboard/users/[id].patch.ts`
- Modify: `server/api/dashboard/users/[id]/reset-password.post.ts`
- Modify: `server/api/dashboard/profile/index.get.ts`
- Modify: `server/api/dashboard/profile/index.patch.ts`
- Modify: `server/api/dashboard/profile/password.patch.ts`
- Modify: `server/api/dashboard/profile/avatar.post.ts`
- Modify: `server/api/dashboard/profile/avatar.delete.ts`
- Modify: `server/api/auth/login.post.ts`
- Modify: `server/api/auth/logout.post.ts`

- [ ] **Step 1: Remove list pagination logic from users handler**

Shift list shaping into `listUsers` service and remove handler-level `page`, `limit`, and `offset` assumptions for admin screens.

- [ ] **Step 2: Move user CRUD logic into service and repo**

Services own:

- user create validation beyond payload format
- role assignment rules
- active/inactive state changes
- password reset orchestration

- [ ] **Step 3: Move profile mutations into service and repo**

Profile services own:

- self profile fetch
- self profile update
- password update
- avatar upload/delete side effects

- [ ] **Step 4: Move login/logout business logic into service and repo**

Auth service owns:

- rate-limit lookup/update flow
- user lookup
- password verification
- session creation

- [ ] **Step 5: Keep route files thin**

Each route should follow the same pattern used in `posts`: validate, read actor/session, call service, return response.

- [ ] **Step 6: Commit**

Run:

```bash
git add server/services/users server/repositories/users server/services/profile server/repositories/profile server/services/auth server/repositories/auth server/api/dashboard/users server/api/dashboard/profile server/api/auth
git commit -m "refactor(core): move users profile and auth into domain layers"
```

Expected: commit created with role-sensitive core domains aligned.

## Task 7: Refactor Operational Domains into Domain Layers

**Files:**
- Create: `server/services/categories/categoryService.ts`
- Create: `server/repositories/categories/categoryRepository.ts`
- Create: `server/services/gallery/galleryService.ts`
- Create: `server/repositories/gallery/galleryRepository.ts`
- Create: `server/services/banners/bannerService.ts`
- Create: `server/repositories/banners/bannerRepository.ts`
- Create: `server/services/pages/pageService.ts`
- Create: `server/repositories/pages/pageRepository.ts`
- Create: `server/services/settings/settingService.ts`
- Create: `server/repositories/settings/settingRepository.ts`
- Modify: category/gallery/banner/pages/settings route files under `server/api/admin/**`

- [ ] **Step 1: Extract category CRUD logic**

Move all category query and business behavior into `categories` service and repo files.

- [ ] **Step 2: Extract gallery CRUD logic**

Move gallery listing, create, patch, delete, and upload metadata persistence into `gallery` service and repo files.

- [ ] **Step 3: Extract banners CRUD logic**

Move banner date handling and create/update/delete logic into services and repos.

- [ ] **Step 4: Extract pages CRUD logic**

Move page create/update/delete/list/get into `pages` services and repos.

- [ ] **Step 5: Extract settings read/update logic**

Move bulk settings update semantics into `settings` services and repos.

- [ ] **Step 6: Remove server-side list shaping from handlers**

Route handlers should no longer manually compose search/pagination/filter behavior for admin screens.

- [ ] **Step 7: Commit**

Run:

```bash
git add server/services/categories server/repositories/categories server/services/gallery server/repositories/gallery server/services/banners server/repositories/banners server/services/pages server/repositories/pages server/services/settings server/repositories/settings server/api/admin/categories server/api/admin/gallery server/api/admin/banners server/api/admin/pages server/api/admin/settings
git commit -m "refactor(admin): move operational domains into service and repo layers"
```

Expected: commit created with operational domains standardized.

## Task 8: Refactor Public Domain into Domain Layers

**Files:**
- Create: `server/services/public/publicContentService.ts`
- Create: `server/repositories/public/publicContentRepository.ts`
- Modify: `server/api/public/posts.get.ts`
- Modify: `server/api/public/posts/[slug].get.ts`
- Modify: `server/api/public/banner.get.ts`
- Modify: `server/api/public/settings.get.ts`
- Modify: `server/api/public/gallery.get.ts`
- Modify: `server/api/public/faqs.get.ts`
- Modify: `server/api/public/testimonials.get.ts`

- [ ] **Step 1: Extract public post listing and detail logic**

Keep one public domain and one public posts service surface.

- [ ] **Step 2: Extract public content read models**

Move FAQ, settings, banner, gallery, and testimonials query logic out of handlers.

- [ ] **Step 3: Preserve cached handler behavior**

If a public route currently uses `defineCachedEventHandler`, keep caching at the route level and call the new service from inside the cached handler.

```ts
export default defineCachedEventHandler(async (event) => {
  return await getPublicGallery(useDb(event))
}, { maxAge: 60, name: 'public-gallery' })
```

- [ ] **Step 4: Commit**

Run:

```bash
git add server/services/public server/repositories/public server/api/public
git commit -m "refactor(public): move public content into domain layers"
```

Expected: commit created with public routes standardized.

## Task 9: Clean Up Validation and Shared Utilities

**Files:**
- Modify: `server/utils/validation.ts`
- Modify: `server/utils/runtime.ts`
- Modify: `server/utils/db.ts` only if parameter typing needs cleanup

- [ ] **Step 1: Remove validation helpers tied to old route namespaces**

Rename or regroup helpers to domain wording instead of `DashboardUsers` / `SantriPostList` when the old names no longer describe final behavior.

- [ ] **Step 2: Keep validation as transport-layer parsing only**

Do not move business rules into `validation.ts`. Keep it focused on request parsing and basic payload shape checks.

- [ ] **Step 3: Clean up dead helpers**

Delete validation and utility functions that only served removed legacy routes.

- [ ] **Step 4: Commit**

Run:

```bash
git add server/utils/validation.ts server/utils/runtime.ts server/utils/db.ts
git commit -m "refactor(server): align validation and shared utilities"
```

Expected: commit created with supporting utility cleanup.

## Task 10: Add and Rewrite Tests After Refactor Completion

**Files:**
- Create: `tests/server/posts-route.test.ts`
- Create: `tests/server/posts-policy.test.ts`
- Create: `tests/server/profile-route.test.ts`
- Create: `tests/server/auth-route.test.ts`
- Create: `tests/server/categories-route.test.ts`
- Create: `tests/server/gallery-route.test.ts`
- Create: `tests/server/banners-route.test.ts`
- Create: `tests/server/pages-route.test.ts`
- Create: `tests/server/settings-route.test.ts`
- Create: `tests/server/public-content-route.test.ts`
- Modify: `tests/server/dashboard/users-route.test.ts`
- Modify: `tests/composables/useAuth.test.ts`
- Modify: `tests/middleware/role.test.ts`
- Modify: `tests/components/post-editor.test.ts`

- [ ] **Step 1: Write lightweight positive/negative tests for small domains**

For `settings`, `banners`, `gallery`, `categories`, `pages`, and `public`, add only the common cases:

```ts
it('returns data for an authorized admin request')
it('rejects unauthorized access')
```

```ts
it('rejects invalid payload')
```

- [ ] **Step 2: Write detailed tests for `posts`**

Cover business rules:

```ts
it('allows admin to create berita')
it('rejects reviewer creating berita')
it('allows santri to create own pena_santri draft')
it('rejects santri approving a post')
it('allows reviewer to approve pena_santri')
it('rejects reviewer approving berita')
it('rejects submit when post is not actor-owned')
it('rejects update when pending_review is locked for santri')
```

- [ ] **Step 3: Write detailed tests for `users`, `profile`, and `auth`**

Cover business rules:

```ts
it('allows admin to list users without server pagination params')
it('rejects reviewer from managing users')
it('allows authenticated user to update own profile')
it('rejects invalid password update')
it('creates a session after valid login')
it('rejects inactive users at login')
```

- [ ] **Step 4: Run focused test groups**

Run:

```bash
pnpm test tests/server/posts-route.test.ts tests/server/posts-policy.test.ts
pnpm test tests/server/profile-route.test.ts tests/server/auth-route.test.ts
pnpm test tests/server/categories-route.test.ts tests/server/gallery-route.test.ts tests/server/banners-route.test.ts tests/server/pages-route.test.ts tests/server/settings-route.test.ts tests/server/public-content-route.test.ts
pnpm test tests/composables/useAuth.test.ts tests/middleware/role.test.ts tests/components/post-editor.test.ts
```

Expected: all targeted suites pass.

- [ ] **Step 5: Run full test suite**

Run:

```bash
pnpm test
```

Expected: full Vitest suite passes.

- [ ] **Step 6: Commit**

Run:

```bash
git add tests
git commit -m "test(server): cover domain-first role refactor"
```

Expected: commit created with final test coverage.

## Task 11: Final Verification and Cleanup

**Files:**
- Modify: any remaining drift files found during verification

- [ ] **Step 1: Search for legacy role-namespace API usage**

Run:

```bash
rg -n "/api/admin/posts|/api/dashboard/santri/posts|/api/dashboard/review" app server tests
```

Expected: no remaining callers or route references.

- [ ] **Step 2: Search for forbidden server pagination code paths**

Run:

```bash
rg -n "limit\\(|offset\\(|page:|pagination:" server/api server/services server/repositories
```

Expected: no admin/dashboard list handlers still implementing server pagination or page-based list shaping for the migrated domains. Public routes may still use bounded queries for content safety where explicitly intentional.

- [ ] **Step 3: Run type-oriented verification**

Run:

```bash
pnpm exec vue-tsc --noEmit
```

Expected: pass, or only pre-existing unrelated failures already documented before the refactor starts. If new failures point into touched files, fix them before proceeding.

- [ ] **Step 4: Run diff hygiene check**

Run:

```bash
git diff --check
```

Expected: no whitespace or merge-marker issues.

- [ ] **Step 5: Commit any final cleanup**

Run:

```bash
git add -A
git commit -m "chore(server): finalize backend domain refactor cleanup"
```

Expected: final cleanup commit created only if required.

## Spec Coverage Check

This plan covers:

- fixed role model: Tasks 1, 5, 6, 10
- domain-first backend grouping: Tasks 2 through 8
- `route -> service -> repo`: Tasks 2 through 8
- no compatibility layer: Task 4 route replacement and legacy route removal
- no wrapper abstraction: all tasks use explicit route files
- one `posts` resource with `type`-driven policy: Tasks 1 through 4
- simplified handlers with no server-side list pagination/search/filter: Tasks 4, 6, 7, 9, 11
- per-route DB access preserved: Tasks 3 through 8
- TDD/testing strategy with light small-domain coverage and rich complex-domain coverage after structural refactor: Task 10

## Placeholder Scan

Checked against the spec and plan:

- no `TODO`
- no `TBD`
- no compatibility placeholders
- no wrapper placeholders
- no deferred policy semantics left undefined

## Type Consistency Check

Key terms used consistently across the plan:

- roles: `admin`, `reviewer`, `santri`
- post types: `berita`, `pena_santri`
- architecture: `route -> service -> repo`
- actor-aware post services:
  - `listPostsForActor`
  - `getPostForActor`
  - `createPostForActor`
  - `submitPostForReview`
  - `approvePostForActor`
