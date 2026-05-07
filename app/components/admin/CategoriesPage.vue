<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type CategoryType = 'berita' | 'pena_santri'

type Category = {
  id: number
  name: string
  slug: string
  type: CategoryType
  parentId: number | null
  parent: { id: number; name: string } | null
}

type CategoryForm = {
  name: string
  slug: string
  type: CategoryType | ''
  parentId: number | null
}

const toast = useToast()

const { data, refresh } = useLazyFetch<{ data: Category[] }>('/api/categories')
const categories = computed(() => data.value?.data ?? [])

const typeFilter = ref<CategoryType | 'all'>('all')
const search = ref('')

const filteredCategories = computed(() => {
  let result = categories.value
  if (typeFilter.value !== 'all') {
    result = result.filter(c => c.type === typeFilter.value)
  }
  const q = search.value.toLowerCase()
  if (q) {
    result = result.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }
  return result
})

const parentOptions = computed(() => {
  const base = [{ label: 'Tidak ada (root)', value: null as number | null }]
  const filtered = editingId.value !== null
    ? categories.value.filter(c => c.type === form.type && c.id !== editingId.value)
    : categories.value.filter(c => c.type === form.type)
  return [...base, ...filtered.map(c => ({ label: c.name, value: c.id }))]
})

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<CategoryForm>({
  name: '',
  slug: '',
  type: '',
  parentId: null,
})
const saving = ref(false)

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)

function slugifyLocal(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || ''
}

let autoSlug = true
function onNameInput() {
  if (autoSlug) {
    form.slug = slugifyLocal(form.name)
  }
}
function onSlugInput() {
  autoSlug = false
}

function openCreate() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.type = typeFilter.value !== 'all' ? typeFilter.value : ''
  form.parentId = null
  autoSlug = true
  isModalOpen.value = true
}

function openEdit(cat: Category) {
  editingId.value = cat.id
  form.name = cat.name
  form.slug = cat.slug
  form.type = cat.type
  form.parentId = cat.parentId
  autoSlug = false
  isModalOpen.value = true
}

async function save() {
  if (!form.type) {
    toast.add({ title: 'Tipe kategori wajib dipilih', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  saving.value = true
  try {
    const body = {
      name: form.name,
      slug: form.slug || undefined,
      type: form.type,
      parentId: form.parentId,
    }
    if (editingId.value !== null) {
      await $fetch(`/api/categories/${editingId.value}`, { method: 'PATCH', body })
      toast.add({ title: 'Kategori diperbarui', color: 'success', icon: 'i-lucide-check-circle' })
    } else {
      await $fetch('/api/categories', { method: 'POST', body })
      toast.add({ title: 'Kategori ditambahkan', color: 'success', icon: 'i-lucide-check-circle' })
    }
    isModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menyimpan', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    saving.value = false
  }
}

function confirmDelete(id: number) {
  deletingId.value = id
  isDeleteModalOpen.value = true
}

async function doDelete() {
  if (deletingId.value === null) return
  deleting.value = true
  try {
    await $fetch(`/api/categories/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Kategori dihapus', color: 'success', icon: 'i-lucide-check-circle' })
    isDeleteModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menghapus', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const TYPE_LABELS: Record<CategoryType, string> = {
  berita: 'Berita',
  pena_santri: 'Pena Santri',
}

const columns: TableColumn<Category>[] = [
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) =>
      h(UBadge, {
        label: TYPE_LABELS[row.original.type],
        color: row.original.type === 'berita' ? 'info' : 'secondary',
        variant: 'subtle',
      }),
  },
  {
    accessorKey: 'parent',
    header: 'Parent',
    cell: ({ row }) =>
      h('span', { class: 'text-muted text-sm' }, row.original.parent?.name ?? '—'),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => h('code', { class: 'text-xs text-muted' }, row.original.slug),
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          icon: 'i-lucide-pencil',
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          color: 'error',
          icon: 'i-lucide-trash-2',
          onClick: () => confirmDelete(row.original.id),
        }),
      ]),
  },
]

const typeFilterOptions = [
  { label: 'Semua tipe', value: 'all' as const },
  { label: 'Berita', value: 'berita' as const },
  { label: 'Pena Santri', value: 'pena_santri' as const },
]

const typeSelectOptions = [
  { label: 'Berita', value: 'berita' },
  { label: 'Pena Santri', value: 'pena_santri' },
]
</script>

<template>
  <AdminDataTable :data="filteredCategories" :columns="columns">
    <template #toolbar-left>
      <UInput v-model="search" placeholder="Cari kategori…" icon="i-ph-magnifying-glass-bold" class="w-52" />
      <USelect v-model="typeFilter" :items="typeFilterOptions" value-key="value" label-key="label" class="w-44" />
    </template>
    <template #toolbar-right>
      <UButton label="Tambah Kategori" icon="i-ph-plus-bold" @click="openCreate" />
    </template>
  </AdminDataTable>

  <UModal v-model:open="isModalOpen" :title="editingId ? 'Edit Kategori' : 'Tambah Kategori'">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nama" required>
          <UInput v-model="form.name" placeholder="Nama kategori" class="w-full" @input="onNameInput" />
        </UFormField>
        <UFormField label="Slug" required>
          <UInput v-model="form.slug" placeholder="slug-kategori" class="w-full" @input="onSlugInput" />
        </UFormField>
        <UFormField label="Tipe" required>
          <USelect
            v-model="form.type"
            :items="typeSelectOptions"
            value-key="value"
            label-key="label"
            placeholder="Pilih tipe…"
            class="w-full"
            @update:model-value="form.parentId = null"
          />
        </UFormField>
        <UFormField label="Parent (opsional)">
          <USelect
            v-model="form.parentId"
            :items="parentOptions"
            value-key="value"
            label-key="label"
            class="w-full"
            :disabled="!form.type"
          />
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

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Kategori">
    <template #body>
      <p class="text-sm">Apakah kamu yakin ingin menghapus kategori ini? Kategori tidak bisa dihapus jika masih digunakan oleh artikel atau memiliki sub-kategori.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
