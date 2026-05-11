<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";

type Testimonial = {
  id: number;
  name: string;
  title: string;
  content: string;
  avatarPath: string | null;
  order: number;
};

const toast = useToast();
const { data, refresh } = useLazyFetch<{ data: Testimonial[] }>(
  "/api/testimonials",
  { key: "admin-testimonials-list" },
);
const testimonials = computed(() => data.value?.data ?? []);

const isModalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: "",
  title: "",
  content: "",
  avatarPath: "",
  order: 0,
});
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
  Object.assign(form, {
    name: "",
    title: "",
    content: "",
    avatarPath: "",
    order: 0,
  });
  uploadFile.value = null;
  uploadPreview.value = null;
  isModalOpen.value = true;
}

function openEdit(item: Testimonial) {
  editingId.value = item.id;
  Object.assign(form, {
    name: item.name,
    title: item.title,
    content: item.content,
    avatarPath: item.avatarPath || "",
    order: item.order,
  });
  uploadFile.value = null;
  uploadPreview.value = item.avatarPath;
  isModalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    let finalImagePath = form.avatarPath;

    if (uploadFile.value) {
      uploading.value = true;
      const formData = new FormData();
      formData.append("image", uploadFile.value);
      const { path } = await $fetch<{ path: string }>(
        "/api/testimonials/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      finalImagePath = path;
      uploading.value = false;
    }

    const payload = { ...form, avatarPath: finalImagePath };
    const url = editingId.value
      ? `/api/testimonials/${editingId.value}`
      : "/api/testimonials";
    const method = editingId.value ? "PATCH" : "POST";

    await $fetch(url, { method, body: payload });
    toast.add({ title: "Testimonial disimpan", color: "success", icon: "i-ph-check-circle" });
    isModalOpen.value = false;
    await refresh();
  } catch (e: unknown) {
    uploading.value = false;
    toast.add({
      title: "Gagal menyimpan",
      description: errorMessage(e),
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
    await $fetch(`/api/testimonials/${deletingId.value}`, { method: "DELETE" });
    toast.add({ title: "Testimonial dihapus", color: "success", icon: "i-ph-check-circle" });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (e: unknown) {
    toast.add({
      title: "Gagal menghapus",
      description: errorMessage(e),
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const columns: TableColumn<Testimonial>[] = [
  { accessorKey: "order", header: "Urutan" },
  imageColumn<Testimonial>({
    accessorKey: "avatarPath",
    alt: (row) => row.name,
    shape: "circle",
    fallbackIcon: "i-ph-user",
  }),
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.name),
  },
  { accessorKey: "title", header: "Prestasi" },
  actionsColumn<Testimonial>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <div>
    <AdminDataTable :data="testimonials" :columns="columns" :show-index="false">
      <template #toolbar-right>
        <UButton
          label="Tambah Testimonial"
          icon="i-ph-plus-bold"
          @click="openCreate"
        />
      </template>
    </AdminDataTable>

    <UModal
      v-model:open="isModalOpen"
      :title="editingId ? 'Edit Testimonial' : 'Tambah Testimonial'"
    >
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
            <AdminImageUploadField
              v-model="uploadPreview"
              shape="circle"
              @file="(f) => (uploadFile = f)"
            />
          </UFormField>

          <UFormField label="Urutan">
            <UInput v-model="form.order" type="number" class="w-full" />
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

    <AdminDeleteConfirmModal
      v-model:open="isDeleteModalOpen"
      title="Hapus Testimonial"
      description="Apakah kamu yakin ingin menghapus testimonial ini? Tindakan ini tidak bisa dibatalkan."
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
