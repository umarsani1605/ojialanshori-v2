<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { BoardMemberDto as BoardMember } from "~~/shared/types";

withDefaults(defineProps<{ card?: boolean }>(), { card: true });

const ROLES = ["Penasehat", "Pengajar"];

const toast = useToast();
const posthog = usePostHog();
const { data, refresh } = useLazyFetch<{ data: BoardMember[] }>(
  "/api/board-members",
  { key: "admin-board-members-list" },
);
const members = computed(() => data.value?.data ?? []);

const isModalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: "", role: "Pengajar", avatarPath: "", order: 0 });
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
  Object.assign(form, { name: "", role: "Pengajar", avatarPath: "", order: 0 });
  uploadFile.value = null;
  uploadPreview.value = null;
  isModalOpen.value = true;
}

function openEdit(item: BoardMember) {
  editingId.value = item.id;
  Object.assign(form, {
    name: item.name,
    role: item.role,
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
        "/api/board-members/upload",
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
      ? `/api/board-members/${editingId.value}`
      : "/api/board-members";
    const method = editingId.value ? "PATCH" : "POST";

    await $fetch(url, { method, body: payload });
    toast.add({ title: "Pengurus disimpan", color: "success", icon: "i-ph-check-circle" });
    isModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    if (uploading.value) {
      posthog?.capture("upload.failed", {
        endpoint: "/api/board-members/upload",
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
    await $fetch(`/api/board-members/${deletingId.value}`, {
      method: "DELETE",
    });
    toast.add({ title: "Pengurus dihapus", color: "success", icon: "i-ph-check-circle" });
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

const columns: TableColumn<BoardMember>[] = [
  { accessorKey: "order", header: "Urutan" },
  imageColumn<BoardMember>({
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
  { accessorKey: "role", header: "Peran" },
  actionsColumn<BoardMember>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <div>
    <AdminDataTable :data="members" :columns="columns" :show-index="false" :card="card" :paginated="false">
      <template #toolbar-right>
        <UButton
          label="Tambah Pengurus"
          icon="i-ph-plus-bold"
          @click="openCreate"
        />
      </template>
    </AdminDataTable>

    <AdminFormModal
      v-model:open="isModalOpen"
      :is-edit="!!editingId"
      entity-label="Pengurus"
      :loading="saving"
      @submit="save"
    >
      <UFormField label="Nama" required>
        <UInput v-model="form.name" class="w-full" />
      </UFormField>

      <UFormField label="Peran" required>
        <USelect v-model="form.role" :items="ROLES" class="w-full" />
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
    </AdminFormModal>

    <AdminDeleteConfirmModal
      v-model:open="isDeleteModalOpen"
      title="Hapus Pengurus"
      description="Apakah kamu yakin ingin menghapus data pengurus ini? Tindakan ini tidak bisa dibatalkan."
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
