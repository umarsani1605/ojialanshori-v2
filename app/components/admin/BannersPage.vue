<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type Banner = {
  id: number
  text: string
  link: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

type BannerForm = {
  text: string
  link: string
  isActive: boolean
  startDate: string
  endDate: string
}

const toast = useToast()

const { data, refresh } = useLazyFetch<{ data: Banner[] }>('/api/admin/banners')
const banners = computed(() => data.value?.data ?? [])

const search = ref('')
const filteredBanners = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return banners.value
  return banners.value.filter(b => b.text.toLowerCase().includes(q))
})

const isModalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<BannerForm>({
  text: '',
  link: '',
  isActive: false,
  startDate: '',
  endDate: '',
})

const isDeleteModalOpen = ref(false)
const deletingId = ref<number | null>(null)
const deleting = ref(false)
const saving = ref(false)
const togglingId = ref<number | null>(null)

function openCreate() {
  editingId.value = null
  form.text = ''
  form.link = ''
  form.isActive = false
  form.startDate = ''
  form.endDate = ''
  isModalOpen.value = true
}

function openEdit(banner: Banner) {
  editingId.value = banner.id
  form.text = banner.text
  form.link = banner.link ?? ''
  form.isActive = banner.isActive
  form.startDate = banner.startDate ?? ''
  form.endDate = banner.endDate ?? ''
  isModalOpen.value = true
}

async function save() {
  saving.value = true
  try {
    const body = {
      text: form.text,
      link: form.link || undefined,
      isActive: form.isActive,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }
    if (editingId.value !== null) {
      await $fetch(`/api/admin/banners/${editingId.value}`, { method: 'PATCH', body })
      toast.add({ title: 'Banner diperbarui', color: 'success', icon: 'i-lucide-check-circle' })
    } else {
      await $fetch('/api/admin/banners', { method: 'POST', body })
      toast.add({ title: 'Banner ditambahkan', color: 'success', icon: 'i-lucide-check-circle' })
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
    await $fetch(`/api/admin/banners/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Banner dihapus', color: 'success', icon: 'i-lucide-check-circle' })
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

async function toggleActive(banner: Banner) {
  togglingId.value = banner.id
  try {
    await $fetch(`/api/admin/banners/${banner.id}`, {
      method: 'PATCH',
      body: {
        text: banner.text,
        link: banner.link ?? undefined,
        isActive: !banner.isActive,
        startDate: banner.startDate ?? undefined,
        endDate: banner.endDate ?? undefined,
      },
    })
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal mengubah status', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    togglingId.value = null
  }
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const columns: TableColumn<Banner>[] = [
  {
    accessorKey: 'text',
    header: 'Teks',
    cell: ({ row }) => h('span', { class: 'line-clamp-2 max-w-xs' }, row.original.text),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          label: row.original.isActive ? 'Aktif' : 'Nonaktif',
          color: row.original.isActive ? 'success' : 'neutral',
          variant: 'subtle',
        }),
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          label: row.original.isActive ? 'Nonaktifkan' : 'Aktifkan',
          loading: togglingId.value === row.original.id,
          onClick: () => toggleActive(row.original),
        }),
      ]),
  },
  {
    accessorKey: 'startDate',
    header: 'Mulai',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.startDate ?? '—'),
  },
  {
    accessorKey: 'endDate',
    header: 'Selesai',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.endDate ?? '—'),
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
  <AdminDataTable :data="filteredBanners" :columns="columns">
    <template #toolbar-left>
      <UInput v-model="search" placeholder="Cari banner…" icon="i-ph-magnifying-glass-bold" class="w-56" />
    </template>
    <template #toolbar-right>
      <UButton label="Tambah Banner" icon="i-ph-plus-bold" @click="openCreate" />
    </template>
  </AdminDataTable>

  <UModal v-model:open="isModalOpen" :title="editingId ? 'Edit Banner' : 'Tambah Banner'">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Teks Banner" required>
          <UTextarea v-model="form.text" placeholder="Teks yang ditampilkan…" :rows="3" class="w-full" />
        </UFormField>
        <UFormField label="Link (opsional)">
          <UInput v-model="form.link" placeholder="https://…" class="w-full" />
        </UFormField>
        <UFormField label="Tanggal Mulai">
          <UInput v-model="form.startDate" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Tanggal Selesai">
          <UInput v-model="form.endDate" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Status">
          <USwitch v-model="form.isActive" label="Aktif" />
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

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Banner">
    <template #body>
      <p class="text-sm">Apakah kamu yakin ingin menghapus banner ini? Tindakan ini tidak bisa dibatalkan.</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
