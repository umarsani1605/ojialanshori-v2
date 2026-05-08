<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type GalleryItem = {
  id: number
  title: string
  imagePath: string
  order: number
  createdAt: string
}

const MAX_GALLERY_ITEMS = 8

const toast = useToast()

const { data, refresh } = useLazyFetch<{ data: GalleryItem[] }>('/api/gallery')
const items = computed(() => data.value?.data ?? [])
const isGalleryFull = computed(() => items.value.length >= MAX_GALLERY_ITEMS)

const search = ref('')
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return items.value
  return items.value.filter(item => item.title.toLowerCase().includes(query))
})

const isUploadModalOpen = ref(false)
const uploadForm = reactive({ title: '' })
const uploadFile = ref<File | null>(null)
const uploadPreview = ref<string | null>(null)
const uploading = ref(false)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadFile.value = file
  uploadPreview.value = URL.createObjectURL(file)
  if (!uploadForm.title) {
    uploadForm.title = file.name.replace(/\.[^.]+$/, '')
  }
}

function openUpload() {
  if (isGalleryFull.value) return
  uploadForm.title = ''
  uploadFile.value = null
  uploadPreview.value = null
  isUploadModalOpen.value = true
}

async function doUpload() {
  if (isGalleryFull.value) {
    toast.add({
      title: 'Galeri sudah penuh',
      description: `Galeri homepage maksimal ${MAX_GALLERY_ITEMS} foto.`,
      color: 'warning',
      icon: 'i-ph-warning',
    })
    return
  }

  if (!uploadFile.value) {
    toast.add({ title: 'Pilih file gambar terlebih dahulu', color: 'warning', icon: 'i-ph-warning' })
    return
  }

  if (!uploadForm.title.trim()) {
    toast.add({ title: 'Judul gambar wajib diisi', color: 'warning', icon: 'i-ph-warning' })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', uploadFile.value)
    const { path } = await $fetch<{ path: string }>('/api/gallery/upload', {
      method: 'POST',
      body: formData,
    })

    await $fetch('/api/gallery', {
      method: 'POST',
      body: {
        title: uploadForm.title,
        imagePath: path,
      },
    })

    toast.add({ title: 'Foto berhasil diunggah', color: 'success', icon: 'i-ph-check-circle' })
    isUploadModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal mengunggah', description: message, color: 'error', icon: 'i-ph-x-circle' })
  } finally {
    uploading.value = false
  }
}

const isEditModalOpen = ref(false)
const editingItem = ref<GalleryItem | null>(null)
const editForm = reactive({ title: '', order: 1 })
const saving = ref(false)

function openEdit(item: GalleryItem) {
  editingItem.value = item
  editForm.title = item.title
  editForm.order = item.order
  isEditModalOpen.value = true
}

async function saveEdit() {
  if (!editingItem.value) return

  saving.value = true
  try {
    await $fetch(`/api/gallery/${editingItem.value.id}`, {
      method: 'PATCH',
      body: {
        title: editForm.title,
        order: editForm.order,
      },
    })

    toast.add({ title: 'Item galeri diperbarui', color: 'success', icon: 'i-ph-check-circle' })
    isEditModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menyimpan', description: message, color: 'error', icon: 'i-ph-x-circle' })
  } finally {
    saving.value = false
  }
}

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
    await $fetch(`/api/gallery/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Foto dihapus', color: 'success', icon: 'i-ph-check-circle' })
    isDeleteModalOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menghapus', description: message, color: 'error', icon: 'i-ph-x-circle' })
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}

const UButton = resolveComponent('UButton')

const columns: TableColumn<GalleryItem>[] = [
  {
    accessorKey: 'imagePath',
    header: 'Foto',
    cell: ({ row }) =>
      h('img', {
        src: row.original.imagePath,
        alt: row.original.title,
        class: 'h-12 w-16 rounded object-cover',
      }),
  },
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'order',
    header: 'Urutan',
    cell: ({ row }) => h('span', { class: 'text-sm tabular-nums' }, String(row.original.order)),
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-2' }, [
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          icon: 'i-ph-pencil-simple',
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          size: 'sm',
          variant: 'ghost',
          color: 'error',
          icon: 'i-ph-trash',
          onClick: () => confirmDelete(row.original.id),
        }),
      ]),
  },
]
</script>

<template>
  <AdminDataTable :data="filteredItems" :columns="columns">
    <template #toolbar-left>
      <UInput v-model="search" placeholder="Cari foto…" icon="i-ph-magnifying-glass-bold" class="w-56" />
    </template>
    <template #toolbar-right>
      <div class="flex items-center gap-4">
        <p v-if="isGalleryFull" class="text-sm">Maksimal 8 foto.</p>
        <UButton label="Upload Foto" icon="i-ph-upload-bold" :disabled="isGalleryFull" @click="openUpload" />
      </div>
    </template>
  </AdminDataTable>

  <UModal v-model:open="isUploadModalOpen" title="Upload Foto">
    <template #body>
      <div class="space-y-4">
        <div class="rounded-lg border-2 border-dashed p-4 text-center">
          <img v-if="uploadPreview" :src="uploadPreview" alt="Preview" class="mx-auto mb-3 max-h-48 rounded object-contain" />
          <label class="cursor-pointer">
            <span class="text-sm text-primary">{{ uploadPreview ? 'Ganti gambar' : 'Pilih gambar' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onFileChange" />
          </label>
          <p class="mt-1 text-xs text-muted">JPG, PNG, WebP · Maks 5MB</p>
        </div>

        <UFormField label="Judul" required>
          <UInput v-model="uploadForm.title" placeholder="Judul foto" class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isUploadModalOpen = false" />
        <UButton label="Upload" icon="i-ph-upload" :loading="uploading" @click="doUpload" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isEditModalOpen" title="Edit Foto">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Judul" required>
          <UInput v-model="editForm.title" class="w-full" />
        </UFormField>
        <UFormField label="Urutan" help="Urutan ditampilkan mulai dari 1.">
          <UInput v-model="editForm.order" type="number" min="1" :max="items.length" class="w-full" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isEditModalOpen = false" />
        <UButton label="Simpan" :loading="saving" @click="saveEdit" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Foto">
    <template #body>
      <p class="text-sm">Apakah kamu yakin ingin menghapus foto ini?</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
