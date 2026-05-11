<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type FAQ = { id: number, question: string, answer: string }

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
  { accessorKey: 'answer', header: 'Jawaban', cell: ({ row }) => h('span', { class: 'text-muted line-clamp-2' }, row.original.answer) },
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