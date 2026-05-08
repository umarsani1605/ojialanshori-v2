<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type Testimonial = { id: number, name: string, title: string, content: string, avatar: string | null, order: number, isActive: boolean }

const toast = useToast()
const { data, refresh } = useFetch<{ data: Testimonial[] }>('/api/testimonials')
const testimonials = computed(() => data.value?.data ?? [])

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', title: '', content: '', avatar: '', order: 0, isActive: true })
const uploadFile = ref<File | null>(null)
const uploadPreview = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadFile.value = file
  uploadPreview.value = URL.createObjectURL(file)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', title: '', content: '', avatar: '', order: 0, isActive: true })
  uploadFile.value = null
  uploadPreview.value = null
  isModalOpen.value = true
}

function openEdit(item: Testimonial) {
  editingId.value = item.id
  Object.assign(form, { name: item.name, title: item.title, content: item.content, avatar: item.avatar || '', order: item.order, isActive: item.isActive })
  uploadFile.value = null
  uploadPreview.value = item.avatar
  isModalOpen.value = true
}

async function save() {
  saving.value = true
  try {
    let finalImagePath = form.avatar

    if (uploadFile.value) {
      uploading.value = true
      const formData = new FormData()
      formData.append('image', uploadFile.value)
      const { path } = await $fetch<{ path: string }>('/api/testimonials/upload', {
        method: 'POST',
        body: formData,
      })
      finalImagePath = path
      uploading.value = false
    }

    const payload = { ...form, avatar: finalImagePath }
    const url = editingId.value ? `/api/testimonials/${editingId.value}` : '/api/testimonials'
    const method = editingId.value ? 'PATCH' : 'POST'
    
    await $fetch(url, { method, body: payload })
    toast.add({ title: 'Testimonial disimpan', color: 'success' })
    isModalOpen.value = false
    await refresh()
  } catch (e: any) {
    uploading.value = false
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
    await $fetch(`/api/testimonials/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Testimonial dihapus', color: 'success' })
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
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<Testimonial>[] = [
  {
    accessorKey: 'avatar', header: 'Foto', cell: ({ row }) => {
       if (row.original.avatar) {
         return h('img', { src: row.original.avatar, alt: row.original.name, class: 'size-10 rounded-full object-cover' })
       }
       return h(UAvatar, { alt: row.original.name, size: 'md' })
    }
  },
  { accessorKey: 'name', header: 'Nama', cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name) },
  { accessorKey: 'title', header: 'Peran/Judul' },
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
    <AdminDataTable :data="testimonials" :columns="columns">
      <template #toolbar-right>
        <UButton label="Tambah Testimonial" icon="i-ph-plus-bold" @click="openCreate" />
      </template>
    </AdminDataTable>

    <UModal v-model:open="isModalOpen" :title="editingId ? 'Edit Testimonial' : 'Tambah Testimonial'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nama" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>

          <UFormField label="Peran/Judul" required>
            <UInput v-model="form.title" class="w-full" />
          </UFormField>
          
          <UFormField label="Kutipan" required>
            <UTextarea v-model="form.content" class="w-full" :rows="4" />
          </UFormField>
          
          <UFormField label="Foto (Opsional)">
            <div class="rounded-lg border-2 border-dashed p-4 text-center">
              <img v-if="uploadPreview" :src="uploadPreview" alt="Preview" class="mx-auto mb-3 size-24 rounded-full object-cover" />
              <label class="cursor-pointer">
                <span class="text-sm text-primary">{{ uploadPreview ? 'Ganti foto' : 'Pilih foto' }}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onFileChange" />
              </label>
              <p class="mt-1 text-xs text-muted">JPG, PNG, WebP · Maks 5MB</p>
            </div>
          </UFormField>

          <UFormField label="Urutan" help="Urutan ditampilkan. Angka lebih kecil tampil lebih awal.">
            <UInput v-model="form.order" type="number" class="w-full" />
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

    <UModal v-model:open="isDeleteModalOpen" title="Hapus Testimonial">
      <template #body>
        <p class="text-sm">Apakah kamu yakin ingin menghapus testimonial ini? Tindakan ini tidak bisa dibatalkan.</p>
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