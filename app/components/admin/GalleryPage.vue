<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type GalleryItem = {
  id: number
  title: string
  imagePath: string
  album: string | null
  order: number
  createdAt: string
}

const toast = useToast()

const { data, refresh } = await useFetch<{ data: GalleryItem[] }>('/api/admin/gallery')
const items = computed(() => data.value?.data ?? [])

const search = ref('')
const filteredItems = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    i => i.title.toLowerCase().includes(q) || (i.album ?? '').toLowerCase().includes(q),
  )
})

// Upload modal
const isUploadModalOpen = ref(false)
const uploadForm = reactive({ title: '', album: '' })
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
  uploadForm.title = ''
  uploadForm.album = ''
  uploadFile.value = null
  uploadPreview.value = null
  isUploadModalOpen.value = true
}

async function doUpload() {
  if (!uploadFile.value) {
    toast.add({ title: 'Pilih file gambar terlebih dahulu', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  if (!uploadForm.title.trim()) {
    toast.add({ title: 'Judul gambar wajib diisi', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('image', uploadFile.value)
    const { path } = await $fetch<{ path: string }>('/api/admin/gallery/upload', { method: 'POST', body: fd })

    await $fetch('/api/admin/gallery', {
      method: 'POST',
      body: { title: uploadForm.title, imagePath: path, album: uploadForm.album || undefined, order: 0 },
    })
    toast.add({ title: 'Foto berhasil diunggah', color: 'success', icon: 'i-lucide-check-circle' })
    isUploadModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal mengunggah', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    uploading.value = false
  }
}

// Edit modal
const isEditModalOpen = ref(false)
const editingItem = ref<GalleryItem | null>(null)
const editForm = reactive({ title: '', album: '', order: 0 })
const saving = ref(false)

function openEdit(item: GalleryItem) {
  editingItem.value = item
  editForm.title = item.title
  editForm.album = item.album ?? ''
  editForm.order = item.order
  isEditModalOpen.value = true
}

async function saveEdit() {
  if (!editingItem.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/gallery/${editingItem.value.id}`, {
      method: 'PATCH',
      body: { title: editForm.title, album: editForm.album || null, order: editForm.order },
    })
    toast.add({ title: 'Item galeri diperbarui', color: 'success', icon: 'i-lucide-check-circle' })
    isEditModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menyimpan', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    saving.value = false
  }
}

// Delete
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
    await $fetch(`/api/admin/gallery/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Foto dihapus', color: 'success', icon: 'i-lucide-check-circle' })
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

const UButton = resolveComponent('UButton')

const columns: TableColumn<GalleryItem>[] = [
  {
    accessorKey: 'imagePath',
    header: 'Foto',
    cell: ({ row }) =>
      h('img', {
        src: row.original.imagePath,
        alt: row.original.title,
        class: 'w-16 h-12 object-cover rounded',
      }),
  },
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'album',
    header: 'Album',
    cell: ({ row }) => h('span', { class: 'text-muted text-sm' }, row.original.album ?? '—'),
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
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-xl font-semibold">Galeri</h1>
      <p class="text-muted text-sm mt-1">Kelola foto-foto galeri website.</p>
    </div>

    <AdminDataTable :data="filteredItems" :columns="columns">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <UInput
            v-model="search"
            placeholder="Cari foto atau album…"
            icon="i-lucide-search"
            class="w-64"
          />
          <UButton
            label="Upload Foto"
            icon="i-lucide-upload"
            @click="openUpload"
          />
        </div>
      </template>
    </AdminDataTable>

    <!-- Upload Modal -->
    <UModal v-model:open="isUploadModalOpen" title="Upload Foto">
      <template #body>
        <div class="space-y-4">
          <div class="border-2 border-dashed rounded-lg p-4 text-center">
            <img
              v-if="uploadPreview"
              :src="uploadPreview"
              alt="Preview"
              class="max-h-48 mx-auto rounded object-contain mb-3"
            />
            <label class="cursor-pointer">
              <span class="text-sm text-primary">
                {{ uploadPreview ? 'Ganti gambar' : 'Pilih gambar' }}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onFileChange" />
            </label>
            <p class="text-xs text-muted mt-1">JPG, PNG, WebP · Maks 5MB</p>
          </div>
          <UFormField label="Judul" required>
            <UInput v-model="uploadForm.title" placeholder="Judul foto" class="w-full" />
          </UFormField>
          <UFormField label="Album (opsional)">
            <UInput v-model="uploadForm.album" placeholder="Nama album" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Batal" @click="isUploadModalOpen = false" />
          <UButton label="Upload" icon="i-lucide-upload" :loading="uploading" @click="doUpload" />
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditModalOpen" title="Edit Foto">
      <template #body>
        <div class="space-y-4">
          <img
            v-if="editingItem"
            :src="editingItem.imagePath"
            :alt="editingItem.title"
            class="max-h-40 rounded object-contain"
          />
          <UFormField label="Judul" required>
            <UInput v-model="editForm.title" class="w-full" />
          </UFormField>
          <UFormField label="Album (opsional)">
            <UInput v-model="editForm.album" placeholder="Nama album" class="w-full" />
          </UFormField>
          <UFormField label="Urutan">
            <UInput v-model.number="editForm.order" type="number" min="0" class="w-full" />
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

    <!-- Delete Confirm Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Hapus Foto">
      <template #body>
        <p class="text-sm">Apakah kamu yakin ingin menghapus foto ini? Tindakan ini tidak bisa dibatalkan.</p>
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
