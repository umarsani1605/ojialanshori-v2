<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { ActivityDto as Activity } from "~~/shared/types";

const toast = useToast();
const posthog = usePostHog();
const { data, refresh } = useLazyFetch<{ data: Activity[] }>("/api/activities", {
  key: "admin-activities-list",
});
const activities = computed(() => data.value?.data ?? []);

const isModalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ title: "", description: "", imagePath: "", order: 0 });
const uploadFile = ref<File | null>(null);
const uploadPreview = ref<string | null>(null);
const saving = ref(false);
const uploading = ref(false);

const isDeleteModalOpen = ref(false);
const deletingId = ref<number | null>(null);
const deleting = ref(false);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadFile.value = file;
  uploadPreview.value = URL.createObjectURL(file);
}

function openCreate() {
  editingId.value = null;
  Object.assign(form, { title: "", description: "", imagePath: "", order: 0 });
  uploadFile.value = null;
  uploadPreview.value = null;
  isModalOpen.value = true;
}

function openEdit(item: Activity) {
  editingId.value = item.id;
  Object.assign(form, {
    title: item.title,
    description: item.description,
    imagePath: item.imagePath,
    order: item.order,
  });
  uploadFile.value = null;
  uploadPreview.value = item.imagePath;
  isModalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    let finalImagePath = form.imagePath;

    if (uploadFile.value) {
      uploading.value = true;
      const formData = new FormData();
      formData.append("image", uploadFile.value);
      const { path } = await $fetch<{ path: string }>(
        "/api/activities/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      finalImagePath = path;
      uploading.value = false;
    }

    if (!finalImagePath) {
      toast.add({ title: "Foto wajib diunggah", color: "warning" });
      saving.value = false;
      return;
    }

    const payload = { ...form, imagePath: finalImagePath };
    const url = editingId.value
      ? `/api/activities/${editingId.value}`
      : "/api/activities";
    const method = editingId.value ? "PATCH" : "POST";

    await $fetch(url, { method, body: payload });
    toast.add({ title: "Kegiatan disimpan", color: "success", icon: "i-ph-check-circle" });
    isModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    if (uploading.value) {
      posthog?.capture("upload.failed", {
        endpoint: "/api/activities/upload",
        reason: errorMessage(error),
        file_size: uploadFile.value?.size,
      });
    }
    uploading.value = false;
    toast.add({
      title: "Gagal menyimpan",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(id: number) {
  deletingId.value = id;
  isDeleteModalOpen.value = true;
}

async function doDelete() {
  if (!deletingId.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/activities/${deletingId.value}`, { method: "DELETE" });
    toast.add({ title: "Kegiatan dihapus", color: "success", icon: "i-ph-check-circle" });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    toast.add({
      title: "Gagal menghapus",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const columns: TableColumn<Activity>[] = [
  { accessorKey: "order", header: "Urutan" },
  imageColumn<Activity>({
    accessorKey: "imagePath",
    alt: (row) => row.title,
  }),
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  actionsColumn<Activity>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <div>
    <AdminDataTable :data="activities" :columns="columns" :show-index="false">
      <template #toolbar-right>
        <UButton
          label="Tambah Kegiatan"
          icon="i-ph-plus-bold"
          @click="openCreate"
        />
      </template>
    </AdminDataTable>

    <AdminFormModal
      v-model:open="isModalOpen"
      :is-edit="!!editingId"
      entity-label="Kegiatan"
      :loading="saving"
      @submit="save"
    >
      <UFormField label="Judul" required>
        <UInput v-model="form.title" class="w-full" />
      </UFormField>

      <UFormField label="Foto" required>
        <AdminImageUploadField
          v-model="uploadPreview"
          @file="(f) => (uploadFile = f)"
        />
      </UFormField>

      <UFormField label="Deskripsi">
        <UTextarea v-model="form.description" class="w-full" :rows="3" />
      </UFormField>

      <UFormField label="Urutan">
        <UInput v-model="form.order" type="number" class="w-full" />
      </UFormField>
    </AdminFormModal>

    <AdminDeleteConfirmModal
      v-model:open="isDeleteModalOpen"
      title="Hapus Kegiatan"
      description="Apakah kamu yakin ingin menghapus kegiatan ini? Tindakan ini tidak bisa dibatalkan."
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
