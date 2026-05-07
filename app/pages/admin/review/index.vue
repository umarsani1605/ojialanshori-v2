<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
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

const { data, status } = await useFetch<QueueResponse>('/api/dashboard/review/queue', {
  key: 'admin-review-queue',
  query: computed(() => ({ page: page.value, limit: PAGE_SIZE })),
  watch: [page],
})

const posts = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<QueuePost>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => h('span', { class: 'font-medium line-clamp-2' }, row.original.title),
  },
  {
    accessorKey: 'author',
    header: 'Penulis',
    cell: ({ row }) => h('span', {}, row.original.author.name),
  },
  {
    accessorKey: 'category',
    header: 'Kategori',
    cell: ({ row }) =>
      row.original.category
        ? h(UBadge, {
            label: row.original.category.name,
            color: row.original.category.type === 'berita' ? 'info' : 'secondary',
            variant: 'subtle',
          })
        : h('span', { class: 'text-muted' }, '—'),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Dikirim',
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
      h(UButton, {
        label: 'Buka',
        size: 'sm',
        color: 'primary',
        variant: 'outline',
        to: `/admin/review/${row.original.id}`,
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
