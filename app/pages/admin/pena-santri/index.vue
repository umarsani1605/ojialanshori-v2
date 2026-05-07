<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Pena Santri',
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

type SelectItem = {
  label: string
  value: string
}

const STATUS_OPTIONS = [
  { label: 'Terbit', value: 'published' },
  { label: 'Dalam Ulasan', value: 'pending_review' },
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
  pending_review: 'Dalam Ulasan',
  draft: 'Draft',
  rejected: 'Ditolak',
}

const PAGE_SIZE = 10

const toast = useToast()
const page = ref(1)
const search = ref('')
const statusFilter = ref<string | undefined>()
const authorFilter = ref<string | undefined>()
const categoryFilter = ref<string | undefined>()

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>('/api/admin/posts')

const posts = computed(() =>
  (data.value?.data ?? []).filter(post => post.category?.type === 'pena_santri' || !post.category),
)

const authorOptions = computed<SelectItem[]>(() => {
  const authors = new Map<number, string>()

  for (const post of posts.value) {
    authors.set(post.author.id, post.author.name)
  }

  return [
    ...Array.from(authors.entries()).map(([id, name]) => ({
      label: name,
      value: String(id),
    })),
  ]
})

const categoryOptions = computed<SelectItem[]>(() => {
  const categories = new Map<number, string>()

  for (const post of posts.value) {
    if (post.category) {
      categories.set(post.category.id, post.category.name)
    }
  }

  return [
    ...Array.from(categories.entries()).map(([id, name]) => ({
      label: name,
      value: String(id),
    })),
  ]
})

const filteredPosts = computed(() => {
  const query = search.value.trim().toLowerCase()

  return posts.value.filter((post) => {
    if (statusFilter.value && post.status !== statusFilter.value) {
      return false
    }

    if (authorFilter.value && String(post.author.id) !== authorFilter.value) {
      return false
    }

    if (categoryFilter.value && String(post.category?.id ?? '') !== categoryFilter.value) {
      return false
    }

    if (query && !post.title.toLowerCase().includes(query)) {
      return false
    }

    return true
  })
})

const total = computed(() => filteredPosts.value.length)

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

watch([search, statusFilter, authorFilter, categoryFilter], () => {
  page.value = 1
})

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)

function confirmDelete(id: number) {
  deletingId.value = id
  isDeleteModalOpen.value = true
}

async function doDelete() {
  if (deletingId.value === null) return

  deleting.value = true

  try {
    await $fetch(`/api/admin/posts/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Artikel dihapus', color: 'success', icon: 'i-lucide-check-circle' })
    isDeleteModalOpen.value = false
    await refresh()
  }
  catch (error: unknown) {
    const message
      = (error as { data?: { message?: string } }).data?.message
        ?? (error as Error).message
        ?? 'Terjadi kesalahan.'

    toast.add({
      title: 'Gagal menghapus artikel',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
  finally {
    deleting.value = false
    deletingId.value = null
  }
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<AdminPost>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) =>
      h('span', { class: 'font-medium line-clamp-2' }, row.original.title),
  },
  {
    accessorKey: 'author',
    header: 'Penulis',
    cell: ({ row }) => h('span', {}, row.original.author.name),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        label: STATUS_LABEL[row.original.status] ?? row.original.status,
        color: STATUS_COLOR[row.original.status] ?? 'neutral',
        variant: 'subtle',
      }),
  },
  {
    accessorKey: 'category',
    header: 'Kategori',
    cell: ({ row }) =>
      row.original.category
        ? h('span', {}, row.original.category.name)
        : h('span', { class: 'text-muted' }, 'Belum dipilih'),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Diperbarui',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted text-sm' },
        new Date(row.original.updatedAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      ),
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-1 justify-end' }, [
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          icon: 'i-lucide-pencil',
          to: `/admin/pena-santri/${row.original.id}/edit`,
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
</script>

<template>
  <UCard
    class="shadow-none!"
    :ui="{
      root: 'ring-transparent divide-y divide-default overflow-hidden',
      header: 'px-4 py-3',
      footer: 'px-4 py-3',
    }"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <UInput
            v-model="search"
            placeholder="Cari judul artikel…"
            icon="i-ph-magnifying-glass-bold"
            class="w-64"
          />
          <USelect
            v-model="authorFilter"
            :items="authorOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua penulis"
            class="w-48"
          />
          <USelect
            v-model="categoryFilter"
            :items="categoryOptions"
            value-key="value"
            label-key="label"
            placeholder="Semua kategori"
            class="w-48"
          />
          <USelect
            v-model="statusFilter"
            :items="STATUS_OPTIONS"
            value-key="value"
            label-key="label"
            placeholder="Semua status"
            class="w-48"
          />
        </div>

        <UButton
          label="Tulis Artikel"
          icon="i-ph-plus-bold"
          to="/admin/pena-santri/create"
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
            <p class="text-muted">Tidak ada artikel pena santri ditemukan.</p>
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
      <p class="text-sm">
        Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa dibatalkan.
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
