<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Halaman Statis',
})

type PageItem = {
  id: number
  title: string
  slug: string
  status: 'draft' | 'published'
  updatedAt: string
}

const toast = useToast()

const PAGE_SIZE = 10
const page = ref(1)
const search = ref('')

const { data, refresh } = useLazyFetch<{ data: PageItem[] }>('/api/pages')
const pages = computed(() => data.value?.data ?? [])

const filteredPages = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return pages.value
  return pages.value.filter(
    p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
  )
})

const total = computed(() => filteredPages.value.length)

const paginatedPages = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredPages.value.slice(start, start + PAGE_SIZE)
})

watch(search, () => { page.value = 1 })

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
    await $fetch(`/api/pages/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Halaman dihapus', color: 'success', icon: 'i-lucide-check-circle' })
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

const columns: TableColumn<PageItem>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => h('code', { class: 'text-xs text-muted' }, row.original.slug),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.status === 'published' ? 'Published' : 'Draft',
        color: row.original.status === 'published' ? 'success' : 'neutral',
        variant: 'subtle',
      }),
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
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          icon: 'i-lucide-pencil',
          to: `/admin/pages/${row.original.id}/edit`,
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
        <UInput v-model="search" placeholder="Cari halaman…" icon="i-ph-magnifying-glass-bold" class="w-56" />
        <UButton label="Buat Halaman Baru" icon="i-ph-plus-bold" to="/admin/pages/create" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable :data="paginatedPages" :columns="columns">
        <template #empty>
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada halaman ditemukan.</p>
          </div>
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-muted shrink-0">Total {{ total }} halaman</p>
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

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Halaman">
    <template #body>
      <p class="text-sm">Apakah kamu yakin ingin menghapus halaman ini? Tindakan ini tidak bisa dibatalkan.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
