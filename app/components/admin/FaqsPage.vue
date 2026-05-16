<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import type { FaqDto as FAQ } from '~~/shared/types'

withDefaults(defineProps<{ card?: boolean }>(), { card: true })

const toast = useToast()
const { data, refresh } = useLazyFetch<{ data: FAQ[] }>('/api/faqs', {
  key: 'admin-faqs-list',
})
const faqs = computed(() => data.value?.data ?? [])

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ question: '', answer: '' })
const saving = ref(false)

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)

function openCreate() {
  editingId.value = null
  Object.assign(form, { question: '', answer: '' })
  isModalOpen.value = true
}

function openEdit(faq: FAQ) {
  editingId.value = faq.id
  Object.assign(form, { question: faq.question, answer: faq.answer })
  isModalOpen.value = true
}

async function save() {
  saving.value = true
  try {
    const url = editingId.value ? `/api/faqs/${editingId.value}` : '/api/faqs'
    const method = editingId.value ? 'PATCH' : 'POST'
    await $fetch(url, { method, body: form })
    toast.add({ title: 'FAQ disimpan', color: 'success', icon: 'i-ph-check-circle' })
    isModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    toast.add({ title: 'Gagal menyimpan', description: errorMessage(error), color: 'error', icon: 'i-ph-x-circle' })
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
    toast.add({ title: 'FAQ dihapus', color: 'success', icon: 'i-ph-check-circle' })
    isDeleteModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    toast.add({ title: 'Gagal menghapus', description: errorMessage(error), color: 'error', icon: 'i-ph-x-circle' })
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}

const columns: TableColumn<FAQ>[] = [
  {
    accessorKey: 'question',
    header: 'Pertanyaan',
    size: 360,
    meta: {
      style: {
        th: { width: '360px', maxWidth: '360px' },
        td: { width: '360px', maxWidth: '360px' },
      },
    },
    cell: ({ row }) =>
      h('span', { class: 'font-medium block whitespace-normal break-words' }, row.original.question),
  },
  {
    accessorKey: 'answer',
    header: 'Jawaban',
    size: 520,
    meta: {
      style: {
        th: { width: '520px', maxWidth: '520px' },
        td: { width: '520px', maxWidth: '520px' },
      },
    },
    cell: ({ row }) =>
      h('span', { class: 'text-muted line-clamp-3 block whitespace-normal break-words' }, row.original.answer),
  },
  actionsColumn<FAQ>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
]
</script>

<template>
  <div>
    <AdminDataTable :data="faqs" :columns="columns" :card="card" :paginated="false">
      <template #toolbar-right>
        <UButton label="Tambah FAQ" icon="i-ph-plus-bold" @click="openCreate" />
      </template>
    </AdminDataTable>

    <AdminFormModal
      v-model:open="isModalOpen"
      :is-edit="!!editingId"
      entity-label="FAQ"
      :loading="saving"
      @submit="save"
    >
      <UFormField label="Pertanyaan" required>
        <UInput v-model="form.question" class="w-full" />
      </UFormField>
      <UFormField label="Jawaban" required>
        <UTextarea v-model="form.answer" class="w-full" :rows="4" />
      </UFormField>
    </AdminFormModal>

    <AdminDeleteConfirmModal
      v-model:open="isDeleteModalOpen"
      title="Hapus FAQ"
      description="Apakah kamu yakin ingin menghapus pertanyaan ini? Tindakan ini tidak bisa dibatalkan."
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>