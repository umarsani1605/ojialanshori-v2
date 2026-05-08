# Public Page Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic management for public pages using a template-based JSON meta approach, centralized settings, and dedicated collection tables.

**Architecture:** 
- Database: Simplify `pages` to hold `template` and `meta` (JSON). Consolidate global info (contacts, socials) into `settings`. Separate tables for `activities` and `board_members`.
- Backend: Update existing `/api/pages` and `/api/settings` endpoints. Create new CRUD endpoints for activities, board members, FAQs, and testimonials.
- Frontend (Admin): 
    - `/admin/pages` lists available page templates.
    - `/admin/pages/[template]` uses a full-page editor layout (patterned after `PostEditor.vue`) for editing JSON meta dynamically based on the template type.
    - `/admin/settings` uses a flat layout for global SEO, contact, and social data.
    - Standard modal-based CRUD pages for collections (Activities, Board Members, FAQ, Testimonials).

**Tech Stack:** Nuxt 3, Vue 3 (Composition API), Nuxt UI, Drizzle ORM, MySQL

---

## File Structure Map

**Database:**
- Modify: `server/db/schema.ts` (Update `pages`, remove `contacts`, add `activities`, `board_members`)

**Backend APIs:**
- Modify: `server/api/pages/index.get.ts`, `server/api/pages/[id].patch.ts`, `server/api/pages/[id].get.ts`
- Delete: `server/api/pages/[id].delete.ts`, `server/api/pages/index.post.ts` (Pages are fixed)
- Modify: `server/api/settings/index.get.ts`, `server/api/settings/index.patch.ts`
- Create: CRUD APIs in `server/api/activities/`, `server/api/board-members/`, `server/api/faqs/`, `server/api/testimonials/`

**Frontend Admin UI:**
- Modify: `app/layouts/admin.vue` (Update navigation links)
- Modify: `app/pages/admin/pages/index.vue`
- Create: `app/components/admin/PagesIndex.vue`
- Create: `app/pages/admin/pages/[template]/index.vue`
- Create: `app/components/admin/PageEditor.vue` (Full-page editor logic)
- Modify: `app/components/admin/SettingsPage.vue` (Flat layout)
- Create: Admin index pages and components for Activities, Board Members, FAQ, and Testimonials (e.g., `app/pages/admin/activities/index.vue`, `app/components/admin/ActivitiesPage.vue`)

---

### Task 1: Update Database Schema

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Modify `pages` table**
Update `pages` to replace `slug` and `status` with `template` and `meta`.

```typescript
export const pages = mysqlTable('pages', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  template: varchar({ length: 100 }).notNull().unique(), // e.g., 'home', 'profile'
  meta: json().notNull().default('{}'), // JSON storage for page-specific content
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
```

- [ ] **Step 2: Remove `contacts` table**
Delete the `contacts` table definition as it's merged into `settings`.

```typescript
// Remove this block:
// export const contacts = mysqlTable('contacts', { ... })
```

- [ ] **Step 3: Create `activities` and `board_members` tables**

```typescript
export const activities = mysqlTable('activities', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  imagePath: varchar({ length: 500 }).notNull(),
  order: int().notNull().default(0),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const boardMembers = mysqlTable('board_members', {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 100 }).notNull(), // e.g., 'Penasehat', 'Pengajar'
  avatarPath: varchar({ length: 500 }),
  order: int().notNull().default(0),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
})
```

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.ts
git commit -m "chore(db): update pages schema and add collections for public pages"
```

### Task 2: Implement Database Migration Script

*Note: Assuming Drizzle Kit is configured for migrations based on existing project structure. If not, this step involves running the standard Drizzle generation command.*

**Files:**
- Run terminal command

- [ ] **Step 1: Generate Migration**
Run: `npx drizzle-kit generate` (or the project's specific migration generation command)
Expected: A new SQL migration file is generated in `server/db/migrations/`.

- [ ] **Step 2: Apply Migration**
Run: `npx drizzle-kit push` (or the project's specific migration application command)
Expected: Database schema is updated successfully.

- [ ] **Step 3: Commit**
```bash
git add server/db/migrations
git commit -m "chore(db): generate and apply migrations for public pages schema"
```

### Task 3: Update Pages Admin API

**Files:**
- Modify: `server/api/pages/index.get.ts`
- Modify: `server/api/pages/[id].get.ts`
- Modify: `server/api/pages/[id].patch.ts`
- Delete: `server/api/pages/index.post.ts`, `server/api/pages/[id].delete.ts`

- [ ] **Step 1: Update GET List API**
Modify `server/api/pages/index.get.ts` to return the new schema. No specific body validation is needed, just fetch.

- [ ] **Step 2: Update GET Single API**
Modify `server/api/pages/[id].get.ts` to fetch by `template` identifier instead of `id` for easier routing, or keep `id` if routing by ID is preferred. Let's route by `template`.
Rename file to `server/api/pages/[template].get.ts`.

```typescript
import { eq } from 'drizzle-orm'
import { pages } from '#server/db/schema'
// ... existing imports ...
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const template = getRouterParam(event, 'template')
  if (!template) throw createError({ statusCode: 400, message: 'Template required' })
  
  const db = useDb(event)
  const page = await db.query.pages.findFirst({
    where: eq(pages.template, template)
  })
  
  if (!page) throw createError({ statusCode: 404, message: 'Page not found' })
  return { data: page }
})
```

- [ ] **Step 3: Update PATCH API**
Rename file to `server/api/pages/[template].patch.ts`.

```typescript
import { eq } from 'drizzle-orm'
import { pages } from '#server/db/schema'
// ... existing imports ...
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const template = getRouterParam(event, 'template')
  if (!template) throw createError({ statusCode: 400, message: 'Template required' })
  
  const body = await readBody(event) // Add proper zod validation here
  
  const db = useDb(event)
  await db.update(pages)
    .set({ meta: body.meta, updatedAt: new Date() })
    .where(eq(pages.template, template))
    
  return { success: true }
})
```

- [ ] **Step 4: Delete unused endpoints**
Remove `index.post.ts` and `[id].delete.ts` from `server/api/pages/` as pages are fixed.

- [ ] **Step 5: Commit**
```bash
git add server/api/pages
git commit -m "feat(api): refactor pages API for template-based JSON meta management"
```

### Task 4: Refactor Settings Admin UI (Flat Layout)

**Files:**
- Modify: `app/components/admin/SettingsPage.vue`

- [ ] **Step 1: Implement Flat Layout**
Replace the dynamic loop with specific fields grouped visually.

```vue
<script setup lang="ts">
// ... existing imports and fetch logic ...
const form = reactive({
  site_name: '',
  site_description: '',
  contact_address: '',
  contact_wa_putra: '',
  contact_wa_putri: '',
  social_instagram: '',
  social_youtube_link: '',
  social_youtube_embed: '',
  social_tiktok: ''
})

watch(settings, (rows) => {
  for (const row of rows) {
    if (row.key in form) form[row.key as keyof typeof form] = row.value
  }
}, { immediate: true })

// ... save logic ...
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div class="flex justify-between items-center border-b border-gray-200 pb-4">
      <div>
        <h2 class="text-lg font-semibold">Pengaturan Global</h2>
        <p class="text-muted text-sm">Konfigurasi SEO, Kontak, dan Sosial Media website.</p>
      </div>
      <UButton label="Simpan Perubahan" :loading="saving" @click="save" color="primary" />
    </div>

    <!-- SEO & Identitas -->
    <UCard>
      <template #header><h3 class="font-medium">SEO & Identitas Situs</h3></template>
      <div class="space-y-4">
        <UFormField label="Nama Situs" name="site_name">
          <UInput v-model="form.site_name" class="w-full" />
        </UFormField>
        <UFormField label="Deskripsi Situs" name="site_description">
          <UTextarea v-model="form.site_description" class="w-full" :rows="3" />
        </UFormField>
      </div>
    </UCard>

    <!-- Kontak -->
    <UCard>
      <template #header><h3 class="font-medium">Kontak</h3></template>
      <div class="space-y-4">
        <UFormField label="Alamat Lengkap" name="contact_address">
          <UTextarea v-model="form.contact_address" class="w-full" :rows="3" />
        </UFormField>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="WhatsApp Putra" name="contact_wa_putra">
            <UInput v-model="form.contact_wa_putra" class="w-full" placeholder="628..." />
          </UFormField>
          <UFormField label="WhatsApp Putri" name="contact_wa_putri">
            <UInput v-model="form.contact_wa_putri" class="w-full" placeholder="628..." />
          </UFormField>
        </div>
      </div>
    </UCard>

    <!-- Sosial Media -->
    <UCard>
      <template #header><h3 class="font-medium">Sosial Media</h3></template>
      <div class="space-y-4">
        <UFormField label="Instagram Link" name="social_instagram">
          <UInput v-model="form.social_instagram" class="w-full" />
        </UFormField>
        <UFormField label="YouTube Link" name="social_youtube_link">
          <UInput v-model="form.social_youtube_link" class="w-full" />
        </UFormField>
        <UFormField label="YouTube Embed Code (Profil)" name="social_youtube_embed">
          <UTextarea v-model="form.social_youtube_embed" class="w-full" :rows="3" />
        </UFormField>
        <UFormField label="TikTok Link" name="social_tiktok">
          <UInput v-model="form.social_tiktok" class="w-full" />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
```

- [ ] **Step 2: Commit**
```bash
git add app/components/admin/SettingsPage.vue
git commit -m "feat(ui): implement flat layout for global settings"
```

### Task 5: Build Public Pages Admin Index

**Files:**
- Modify: `app/layouts/admin.vue`
- Modify: `app/pages/admin/pages/index.vue`
- Create: `app/components/admin/PagesIndex.vue`

- [ ] **Step 1: Update Sidebar Menu**
In `app/layouts/admin.vue`, update the "Halaman Statis" label to "Halaman Publik". Add placeholder links for new collections if desired, or do that in a later specific task.

- [ ] **Step 2: Create PagesIndex Component**
Create `app/components/admin/PagesIndex.vue`. It fetches the list of pages and uses `AdminDataTable`. The only action is "Edit" which navigates to `/admin/pages/[template]`.

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type PageItem = { id: number, title: string, template: string, updatedAt: string }
const { data } = useFetch<{ data: PageItem[] }>('/api/pages')
const pages = computed(() => data.value?.data ?? [])

const UButton = resolveComponent('UButton')

const columns: TableColumn<PageItem>[] = [
  { accessorKey: 'title', header: 'Halaman', cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title) },
  { accessorKey: 'template', header: 'Template' },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
      h(UButton, {
        size: 'sm', variant: 'ghost', icon: 'i-ph-pencil-simple',
        to: `/admin/pages/${row.original.template}`
      })
    ]),
  },
]
</script>

<template>
  <AdminDataTable :data="pages" :columns="columns" />
</template>
```

- [ ] **Step 3: Update Pages Index Page**
In `app/pages/admin/pages/index.vue`, use the new component and update title.

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Halaman Publik',
})
</script>
<template>
  <AdminPagesIndex />
</template>
```

- [ ] **Step 4: Commit**
```bash
git add app/layouts/admin.vue app/pages/admin/pages/index.vue app/components/admin/PagesIndex.vue
git commit -m "feat(ui): create index view for public pages management"
```

### Task 6: Build Full-Page Editor for Public Pages

**Files:**
- Create: `app/pages/admin/pages/[template]/index.vue`
- Create: `app/components/admin/PageEditor.vue`

- [ ] **Step 1: Create Page Router Meta**
Create `app/pages/admin/pages/[template]/index.vue`.

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Edit Halaman',
})
const route = useRoute()
const template = route.params.template as string
</script>
<template>
  <AdminPageEditor :template="template" />
</template>
```

- [ ] **Step 2: Create PageEditor Component**
Create `app/components/admin/PageEditor.vue` mimicking the `PostEditor.vue` layout.

```vue
<script setup lang="ts">
const props = defineProps<{ template: string }>()
const toast = useToast()

const { data, refresh } = useFetch(`/api/pages/${props.template}`)
const meta = ref<Record<string, any>>({})
const saving = ref(false)

watch(() => data.value?.data?.meta, (newMeta) => {
  if (newMeta) {
    // Parse if it's a string, or assign directly if JSON object
    meta.value = typeof newMeta === 'string' ? JSON.parse(newMeta) : { ...newMeta }
  } else {
    // Initialize default structures based on template
    if (props.template === 'home') {
      meta.value = { subtitle: '', description: '', features: '', maxNews: 3, maxPena: 3 }
    } else if (props.template === 'profile') {
      meta.value = { overview: '', vision: '', mission: '' }
    }
  }
}, { immediate: true })

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/pages/${props.template}`, {
      method: 'PATCH',
      body: { meta: meta.value }
    })
    toast.add({ title: 'Perubahan disimpan', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Gagal menyimpan', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50 pb-8">
    <!-- Action Bar -->
    <div class="flex items-center justify-between px-2 mb-6">
      <UButton to="/admin/pages" variant="link" color="neutral" icon="i-ph-arrow-left">
        Kembali
      </UButton>
      <UButton color="primary" :loading="saving" @click="save">
        Simpan Perubahan
      </UButton>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-3xl mx-auto">
      <h2 class="text-xl font-bold mb-4 capitalize">Pengaturan: {{ template }}</h2>

      <!-- Home Template Form -->
      <UCard v-if="template === 'home'" class="space-y-5">
        <UFormField label="Subjudul (Hero)" name="subtitle">
          <UInput v-model="meta.subtitle" class="w-full" />
        </UFormField>
        <UFormField label="Deskripsi (Hero)" name="description">
          <UTextarea v-model="meta.description" class="w-full" :rows="3" />
        </UFormField>
        <UFormField label="Teks Features" name="features">
          <UTextarea v-model="meta.features" class="w-full" :rows="3" placeholder="Gunakan baris baru untuk memisahkan item" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Maks Berita Ditampilkan" name="maxNews">
            <UInput v-model="meta.maxNews" type="number" class="w-full" />
          </UFormField>
          <UFormField label="Maks Pena Santri Ditampilkan" name="maxPena">
            <UInput v-model="meta.maxPena" type="number" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Profile Template Form -->
      <UCard v-else-if="template === 'profile'" class="space-y-5">
        <UFormField label="Selayang Pandang" name="overview">
          <UTextarea v-model="meta.overview" class="w-full" :rows="5" />
        </UFormField>
        <UFormField label="Visi" name="vision">
          <UTextarea v-model="meta.vision" class="w-full" :rows="3" />
        </UFormField>
        <UFormField label="Misi" name="mission">
          <UTextarea v-model="meta.mission" class="w-full" :rows="5" placeholder="Gunakan baris baru untuk memisahkan poin" />
        </UFormField>
      </UCard>

      <!-- Fallback / Empty State -->
      <UCard v-else>
        <div class="text-center py-8 text-muted">
          Konfigurasi untuk halaman ini tidak memerlukan form spesifik di sini.
        </div>
      </UCard>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**
```bash
git add app/pages/admin/pages app/components/admin/PageEditor.vue
git commit -m "feat(ui): build full-page dynamic editor for public pages"
```

---
*Note: The subsequent tasks to build the CRUD Modals for Activities, Board Members, FAQs, and Testimonials would follow the established `AdminCategoriesPage` pattern and are best handled as separate implementation sub-plans given the scope.*
