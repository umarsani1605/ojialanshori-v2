# Public Collections Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full CRUD (Create, Read, Update, Delete) Admin management for four public collections: Activities, Board Members, FAQs, and Testimonials.

**Architecture:** 
- Backend: Four sets of API endpoints (`index.get`, `index.post`, `[id].patch`, `[id].delete`) interfacing directly with Drizzle ORM.
- Frontend (Admin): Four Vue components (`ActivitiesPage.vue`, `BoardMembersPage.vue`, `FaqsPage.vue`, `TestimonialsPage.vue`) using the established `AdminDataTable` and `UModal` pattern for inline editing.

**Tech Stack:** Nuxt 3, Vue 3 (Composition API), Nuxt UI, Drizzle ORM, Zod

---

## File Structure Map

**Backend APIs:**
- Create: `server/api/activities/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Create: `server/api/board-members/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Create: `server/api/faqs/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Create: `server/api/testimonials/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`

**Frontend Admin UI:**
- Modify: `app/components/admin/ActivitiesPage.vue`
- Modify: `app/components/admin/BoardMembersPage.vue`
- Modify: `app/components/admin/FaqsPage.vue`
- Modify: `app/components/admin/TestimonialsPage.vue`

---

### Task 1: Build FAQ Management

**Files:**
- Create: `server/api/faqs/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Modify: `app/components/admin/FaqsPage.vue`

- [ ] **Step 1: Create FAQ API Endpoints**
Create the 4 files in `server/api/faqs/`.

`server/api/faqs/index.get.ts`:
```typescript
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const data = await db.query.faqs.findMany({
    orderBy: (faqs, { desc }) => [desc(faqs.createdAt)]
  })
  return { data }
})
```

`server/api/faqs/index.post.ts`:
```typescript
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event) // Basic implementation, should ideally use Zod
  const db = useDb(event)
  
  const [result] = await db.insert(faqs).values({
    question: body.question,
    answer: body.answer,
    order: body.order || 0,
    isActive: body.isActive ?? true
  })
  
  return { data: { id: result.insertId } }
})
```

`server/api/faqs/[id].patch.ts`:
```typescript
import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readBody(event)
  const db = useDb(event)
  
  await db.update(faqs).set({
    question: body.question,
    answer: body.answer,
    order: body.order,
    isActive: body.isActive,
    updatedAt: new Date()
  }).where(eq(faqs.id, id))
  
  return { success: true }
})
```

`server/api/faqs/[id].delete.ts`:
```typescript
import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)
  await db.delete(faqs).where(eq(faqs.id, id))
  return { success: true }
})
```

- [ ] **Step 2: Implement FaqsPage.vue Component**
Modify `app/components/admin/FaqsPage.vue` to include the `AdminDataTable` and `UModal` for CRUD.

```vue
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type FAQ = { id: number, question: string, answer: string, isActive: boolean }

const toast = useToast()
const { data, refresh } = useFetch<{ data: FAQ[] }>('/api/faqs')
const faqs = computed(() => data.value?.data ?? [])

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ question: '', answer: '', isActive: true })
const saving = ref(false)

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)

function openCreate() {
  editingId.value = null
  Object.assign(form, { question: '', answer: '', isActive: true })
  isModalOpen.value = true
}

function openEdit(faq: FAQ) {
  editingId.value = faq.id
  Object.assign(form, { question: faq.question, answer: faq.answer, isActive: faq.isActive })
  isModalOpen.value = true
}

async function save() {
  saving.value = true
  try {
    const url = editingId.value ? `/api/faqs/${editingId.value}` : '/api/faqs'
    const method = editingId.value ? 'PATCH' : 'POST'
    await $fetch(url, { method, body: form })
    toast.add({ title: 'FAQ disimpan', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Gagal menyimpan', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function confirmDelete(id: number) {
  deletingId.value = id
  isDeleteModalOpen.value = true
}

async function doDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await $fetch(`/api/faqs/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'FAQ dihapus', color: 'success' })
    isDeleteModalOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Gagal menghapus', description: e.message, color: 'error' })
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<FAQ>[] = [
  { accessorKey: 'question', header: 'Pertanyaan', cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.question) },
  { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => h(UBadge, { color: row.original.isActive ? 'success' : 'neutral', variant: 'subtle' }, () => row.original.isActive ? 'Aktif' : 'Draft') },
  {
    accessorKey: 'actions', header: '', cell: ({ row }) => h('div', { class: 'flex justify-end gap-2' }, [
      h(UButton, { size: 'sm', variant: 'ghost', icon: 'i-ph-pencil-simple', onClick: () => openEdit(row.original) }),
      h(UButton, { size: 'sm', variant: 'ghost', color: 'error', icon: 'i-ph-trash', onClick: () => confirmDelete(row.original.id) }),
    ]),
  },
]
</script>

<template>
  <div>
    <AdminDataTable :data="faqs" :columns="columns">
      <template #toolbar-right>
        <UButton label="Tambah FAQ" icon="i-ph-plus-bold" @click="openCreate" />
      </template>
    </AdminDataTable>

    <UModal v-model:open="isModalOpen" :title="editingId ? 'Edit FAQ' : 'Tambah FAQ'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Pertanyaan" required>
            <UInput v-model="form.question" class="w-full" />
          </UFormField>
          <UFormField label="Jawaban" required>
            <UTextarea v-model="form.answer" class="w-full" :rows="4" />
          </UFormField>
          <UFormField label="Status" name="isActive">
            <UCheckbox v-model="form.isActive" label="Tampilkan di halaman publik" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Batal" @click="isModalOpen = false" />
          <UButton label="Simpan" :loading="saving" @click="save" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isDeleteModalOpen" title="Hapus FAQ">
      <template #body>
        <p class="text-sm">Apakah kamu yakin ingin menghapus pertanyaan ini? Tindakan ini tidak bisa dibatalkan.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
          <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>
```

- [ ] **Step 3: Commit**
```bash
git add server/api/faqs app/components/admin/FaqsPage.vue
git commit -m "feat(ui,api): implement FAQ management CRUD"
```

### Task 2: Build Activities Management

**Files:**
- Create: `server/api/activities/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Modify: `app/components/admin/ActivitiesPage.vue`

- [ ] **Step 1: Create Activities API Endpoints**
Follow the same pattern as FAQs but for the `activities` table. Include `title`, `description`, `imagePath`, and `order`.

- [ ] **Step 2: Implement ActivitiesPage.vue Component**
Implement the component similar to `FaqsPage.vue`.
**Crucial Difference:** The form needs an image upload field for `imagePath`. Use the existing `UFileUpload` component as seen in `PostEditor.vue`.

```vue
<!-- Inside the UModal body for Activities -->
<UFormField label="Judul Kegiatan" required>
  <UInput v-model="form.title" class="w-full" />
</UFormField>
<UFormField label="Foto Kegiatan" required>
  <UFileUpload
    v-model="form.imageFile"
    accept="image/jpeg,image/png,image/webp"
    variant="area"
    icon="i-ph-image-square"
  />
  <!-- Add logic to upload image and set form.imagePath before saving, similar to existing media logic -->
</UFormField>
<UFormField label="Deskripsi">
  <UTextarea v-model="form.description" class="w-full" :rows="3" />
</UFormField>
```

- [ ] **Step 3: Commit**
```bash
git add server/api/activities app/components/admin/ActivitiesPage.vue
git commit -m "feat(ui,api): implement Activities management CRUD"
```

### Task 3: Build Board Members Management

**Files:**
- Create: `server/api/board-members/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Modify: `app/components/admin/BoardMembersPage.vue`

- [ ] **Step 1: Create Board Members API Endpoints**
Follow the pattern for the `boardMembers` table. Fields: `name`, `role`, `avatarPath`, `order`.

- [ ] **Step 2: Implement BoardMembersPage.vue Component**
Implement the component. Use `USelect` or `UInput` for `role` (e.g., 'Penasehat', 'Pengajar'). Use `UFileUpload` for the avatar.

- [ ] **Step 3: Commit**
```bash
git add server/api/board-members app/components/admin/BoardMembersPage.vue
git commit -m "feat(ui,api): implement Board Members management CRUD"
```

### Task 4: Build Testimonials Management

**Files:**
- Create: `server/api/testimonials/index.get.ts`, `index.post.ts`, `[id].patch.ts`, `[id].delete.ts`
- Modify: `app/components/admin/TestimonialsPage.vue`

- [ ] **Step 1: Create Testimonials API Endpoints**
Follow the pattern for the `testimonials` table. Fields: `name`, `title`, `content`, `avatar`, `isActive`.

- [ ] **Step 2: Implement TestimonialsPage.vue Component**
Implement the component. Fields include Name, Role/Title (`title`), Quote (`content` text area), Avatar upload, and Status toggle (`isActive`).

- [ ] **Step 3: Commit**
```bash
git add server/api/testimonials app/components/admin/TestimonialsPage.vue
git commit -m "feat(ui,api): implement Testimonials management CRUD"
```
