<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { GalleryItemDto as GalleryItem } from "~~/shared/types";
import { MAX_GALLERY_ITEMS } from "~/constants/gallery";

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Galeri',
})

const toast = useToast();

const { data, refresh } = useLazyFetch<{ data: GalleryItem[] }>("/api/gallery", {
  key: "admin-gallery-list",
});
const items = computed(() => data.value?.data ?? []);
const isGalleryFull = computed(() => items.value.length >= MAX_GALLERY_ITEMS);

const search = ref("");
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return items.value;
  return items.value.filter((item) => item.title.toLowerCase().includes(query));
});

const isUploadModalOpen = ref(false);
const uploadForm = reactive({ title: "" });
const uploadFile = ref<File | null>(null);
const uploadPreview = ref<string | null>(null);
const uploading = ref(false);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadFile.value = file;
  uploadPreview.value = URL.createObjectURL(file);
  if (!uploadForm.title) {
    uploadForm.title = file.name.replace(/\.[^.]+$/, "");
  }
}

function openUpload() {
  if (isGalleryFull.value) return;
  uploadForm.title = "";
  uploadFile.value = null;
  uploadPreview.value = null;
  isUploadModalOpen.value = true;
}

async function doUpload() {
  if (isGalleryFull.value) {
    toast.add({
      title: "Galeri sudah penuh",
      description: `Galeri homepage maksimal ${MAX_GALLERY_ITEMS} foto.`,
      color: "warning",
      icon: "i-ph-warning",
    });
    return;
  }

  if (!uploadFile.value) {
    toast.add({
      title: "Pilih file gambar terlebih dahulu",
      color: "warning",
      icon: "i-ph-warning",
    });
    return;
  }

  if (!uploadForm.title.trim()) {
    toast.add({
      title: "Judul gambar wajib diisi",
      color: "warning",
      icon: "i-ph-warning",
    });
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("image", uploadFile.value);
    const { path } = await $fetch<{ path: string }>("/api/gallery/upload", {
      method: "POST",
      body: formData,
    });

    await $fetch("/api/gallery", {
      method: "POST",
      body: {
        title: uploadForm.title,
        imagePath: path,
      },
    });

    toast.add({
      title: "Foto berhasil diunggah",
      color: "success",
      icon: "i-ph-check-circle",
    });
    isUploadModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan.";
    toast.add({
      title: "Gagal mengunggah",
      description: message,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    uploading.value = false;
  }
}

const isEditModalOpen = ref(false);
const editingItem = ref<GalleryItem | null>(null);
const editForm = reactive({ title: "", order: 1 });
const saving = ref(false);

function openEdit(item: GalleryItem) {
  editingItem.value = item;
  editForm.title = item.title;
  editForm.order = item.order;
  isEditModalOpen.value = true;
}

async function saveEdit() {
  if (!editingItem.value) return;

  saving.value = true;
  try {
    await $fetch(`/api/gallery/${editingItem.value.id}`, {
      method: "PATCH",
      body: {
        title: editForm.title,
        order: editForm.order,
      },
    });

    toast.add({
      title: "Item galeri diperbarui",
      color: "success",
      icon: "i-ph-check-circle",
    });
    isEditModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan.";
    toast.add({
      title: "Gagal menyimpan",
      description: message,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    saving.value = false;
  }
}

const isDeleteModalOpen = ref(false);
const deletingId = ref<number | null>(null);
const deleting = ref(false);

function confirmDelete(id: number) {
  deletingId.value = id;
  isDeleteModalOpen.value = true;
}

async function doDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await $fetch(`/api/gallery/${deletingId.value}`, { method: "DELETE" });
    toast.add({
      title: "Foto dihapus",
      color: "success",
      icon: "i-ph-check-circle",
    });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan.";
    toast.add({
      title: "Gagal menghapus",
      description: message,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const columns: TableColumn<GalleryItem>[] = [
  { accessorKey: "order", header: "Urutan", size: 56 },
  imageColumn<GalleryItem>({
    accessorKey: "imagePath",
    alt: (row) => row.title,
  }),
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  actionsColumn<GalleryItem>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <AdminDataTable :data="filteredItems" :columns="columns" :show-index="false">
    <template #toolbar-left>
      <UInput
        v-model="search"
        placeholder="Cari foto…"
        icon="i-ph-magnifying-glass-bold"
        class="w-56"
      />
    </template>
    <template #toolbar-right>
      <div class="flex flex-row-reverse md:flex-row items-center gap-4">
        <p v-if="isGalleryFull" class="text-sm">Maksimal 8 foto.</p>
        <UButton
          label="Upload Foto"
          icon="i-ph-upload-bold"
          :disabled="isGalleryFull"
          @click="openUpload"
        />
      </div>
    </template>
  </AdminDataTable>

  <AdminFormModal
    v-model:open="isUploadModalOpen"
    title="Upload Foto"
    submit-label="Upload"
    :loading="uploading"
    @submit="doUpload"
  >
    <AdminImageUploadField
      v-model="uploadPreview"
      @file="(f) => (uploadFile = f)"
    />

    <UFormField label="Judul" required>
      <UInput
        v-model="uploadForm.title"
        placeholder="Judul foto"
        class="w-full"
      />
    </UFormField>
  </AdminFormModal>

  <AdminFormModal
    v-model:open="isEditModalOpen"
    is-edit
    title="Edit Foto"
    :loading="saving"
    @submit="saveEdit"
  >
    <UFormField label="Judul" required>
      <UInput v-model="editForm.title" class="w-full" />
    </UFormField>
    <UFormField label="Urutan" help="Urutan ditampilkan mulai dari 1.">
      <UInput
        v-model="editForm.order"
        type="number"
        min="1"
        :max="items.length"
        class="w-full"
      />
    </UFormField>
  </AdminFormModal>

  <AdminDeleteConfirmModal
    v-model:open="isDeleteModalOpen"
    title="Hapus Foto"
    description="Apakah kamu yakin ingin menghapus foto ini?"
    :loading="deleting"
    @confirm="doDelete"
  />
</template>
