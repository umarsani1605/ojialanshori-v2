<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'santri',
})

type StatusFilter = '' | 'published' | 'pending_review' | 'rejected' | 'draft'

type PostRow = {
  id: number
  title: string
  slug: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  rejectionNote: string | null
  createdAt: string
  publishedAt: string | null
  categoryName: string | null
  categoryType: 'berita' | 'pena_santri' | null
}

type ListResponse = {
  data: PostRow[]
  counts: {
    all: number
    published: number
    pendingReview: number
    rejected: number
    draft: number
  }
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const initialStatus = typeof route.query.status === 'string' ? route.query.status : ''
const activeStatus = ref<StatusFilter>(
  ['published', 'pending_review', 'rejected', 'draft'].includes(initialStatus)
    ? initialStatus as StatusFilter
    : '',
)

watch(activeStatus, async (value) => {
  await router.replace({
    query: value ? { ...route.query, status: value } : Object.fromEntries(
      Object.entries(route.query).filter(([key]) => key !== 'status'),
    ),
  })
})

watch(() => route.query.status, (value) => {
  const next = typeof value === 'string' ? value : ''
  activeStatus.value = ['published', 'pending_review', 'rejected', 'draft'].includes(next)
    ? next as StatusFilter
    : ''
})

const query = computed(() => activeStatus.value ? { status: activeStatus.value } : {})

const { data, status, refresh } = await useFetch<ListResponse>('/api/dashboard/santri/posts', {
  query,
  key: () => `dashboard-santri-posts:${activeStatus.value || 'all'}`,
})

const posts = computed(() => data.value?.data ?? [])
const counts = computed(() => data.value?.counts ?? {
  all: 0,
  published: 0,
  pendingReview: 0,
  rejected: 0,
  draft: 0,
})

const deleteTarget = ref<PostRow | null>(null)
const deleteModalOpen = ref(false)
const deleting = ref(false)

const tabs = computed(() => [
  { label: 'Semua', value: '', count: counts.value.all },
  { label: 'Terpublikasi', value: 'published', count: counts.value.published },
  { label: 'Menunggu Review', value: 'pending_review', count: counts.value.pendingReview },
  { label: 'Ditolak', value: 'rejected', count: counts.value.rejected },
  { label: 'Draft', value: 'draft', count: counts.value.draft },
])

function formatDate(iso: string | null) {
  if (!iso) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function getStatusColor(status: PostRow['status']) {
  return {
    published: 'success',
    pending_review: 'warning',
    rejected: 'error',
    draft: 'neutral',
  }[status] as 'success' | 'warning' | 'error' | 'neutral'
}

function getStatusLabel(status: PostRow['status']) {
  return {
    published: 'Terpublikasi',
    pending_review: 'Menunggu Review',
    rejected: 'Ditolak',
    draft: 'Draft',
  }[status]
}

function getPublicPath(row: PostRow) {
  return row.categoryType === 'berita' ? '/berita' : '/pena-santri'
}

function openDeleteModal(row: PostRow) {
  deleteTarget.value = row
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return

  deleting.value = true
  try {
    await $fetch(`/api/dashboard/santri/posts/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: 'Post dihapus',
      color: 'success',
      icon: 'i-lucide-check',
    })
    deleteTarget.value = null
    deleteModalOpen.value = false
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Gagal menghapus post',
      description: (error as { data?: { message?: string }, message?: string }).data?.message
        ?? (error as Error).message
        ?? 'Terjadi kesalahan.',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    deleting.value = false
  }
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<PostRow>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => {
      const post = row.original
      return h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate text-sm font-medium text-neutral-800' }, post.title),
        post.status === 'rejected' && post.rejectionNote
          ? h('p', { class: 'mt-1 max-w-xs truncate text-xs text-error-500' }, post.rejectionNote)
          : null,
      ])
    },
  },
  {
    accessorKey: 'categoryName',
    header: 'Kategori',
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-700' }, row.original.categoryName ?? 'Belum dipilih'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: getStatusColor(row.original.status),
      variant: 'subtle',
      size: 'xs',
    }, () => getStatusLabel(row.original.status)),
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ row }) => h('span', { class: 'text-sm text-neutral-500' }, formatDate(row.original.publishedAt ?? row.original.createdAt)),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Aksi'),
    cell: ({ row }) => {
      const post = row.original
      const actions = []

      if (post.status === 'published') {
        actions.push(h(UButton, {
          to: getPublicPath(post),
          target: '_blank',
          icon: 'i-lucide-eye',
          variant: 'ghost',
          size: 'xs',
          color: 'neutral',
        }))
      }

      if (post.status === 'draft' || post.status === 'rejected') {
        actions.push(h(UButton, {
          to: `/dashboard/posts/${post.id}/edit`,
          icon: 'i-lucide-pencil',
          variant: 'ghost',
          size: 'xs',
          color: 'neutral',
        }))
      }

      actions.push(h(UButton, {
        icon: 'i-lucide-trash-2',
        variant: 'ghost',
        size: 'xs',
        color: 'error',
        onClick: () => openDeleteModal(post),
      }))

      return h('div', { class: 'flex justify-end gap-1' }, actions)
    },
  },
]
</script>

<template>
  <UContainer class="max-w-5xl px-6 py-8">
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-semibold">Post Saya</h1>
        </div>

        <UButton
          to="/dashboard/posts/create"
          color="primary"
          icon="i-lucide-plus"
          size="sm"
        >
          Tulis Post Baru
        </UButton>
      </div>

      <div class="flex overflow-x-auto border-b border-neutral-200">
        <button
          v-for="tab in tabs"
          :key="tab.label"
          type="button"
          class="-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeStatus === tab.value ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted hover:text-neutral-900'"
          @click="activeStatus = tab.value as StatusFilter"
        >
          {{ tab.label }}
          <UBadge size="xs" color="neutral" variant="subtle">
            {{ tab.count }}
          </UBadge>
        </button>
      </div>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template v-if="status === 'pending'">
          <div class="flex items-center justify-center py-16">
            <UIcon name="i-lucide-loader-circle" class="text-2xl text-neutral-400 animate-spin" />
          </div>
        </template>
        <template v-else-if="posts.length === 0">
          <div class="py-16 text-center text-sm text-neutral-500">
            Tidak ada post yang cocok dengan filter ini.
          </div>
        </template>
        <template v-else>
          <UTable
            :data="posts"
            :columns="columns"
            :ui="{ th: 'text-xs', td: 'align-middle' }"
          />
        </template>
      </UCard>
    </div>
  </UContainer>

  <UModal v-model:open="deleteModalOpen" title="Hapus Post?">
    <template #body>
      <p class="text-sm text-neutral-600">
        Tindakan ini tidak bisa dibatalkan.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          :disabled="deleting"
          @click="deleteModalOpen = false; deleteTarget = null"
        >
          Batal
        </UButton>
        <UButton color="error" :loading="deleting" @click="confirmDelete">
          Hapus
        </UButton>
      </div>
    </template>
  </UModal>
</template>
