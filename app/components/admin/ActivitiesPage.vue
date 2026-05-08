<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

type Activity = {
  id: number;
  title: string;
  description: string;
  imagePath: string;
  order: number;
};

const toast = useToast();
const { data, refresh } = useFetch<{ data: Activity[] }>("/api/activities");
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
    toast.add({ title: "Kegiatan disimpan", color: "success" });
    isModalOpen.value = false;
    await refresh();
  } catch (e: any) {
    uploading.value = false;
    toast.add({
      title: "Gagal menyimpan",
      description: e.message,
      color: "error",
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
    toast.add({ title: "Kegiatan dihapus", color: "success" });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (e: any) {
    toast.add({
      title: "Gagal menghapus",
      description: e.message,
      color: "error",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const UButton = resolveComponent("UButton");

const columns: TableColumn<Activity>[] = [
  { accessorKey: "order", header: "Urutan" },
  {
    accessorKey: "imagePath",
    header: "Foto",
    cell: ({ row }) =>
      h("img", {
        src: row.original.imagePath,
        alt: row.original.title,
        class: "h-24 w-auto rounded-2xl object-cover",
      }),
  },
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "flex justify-end gap-2" }, [
        h(UButton, {
          size: "sm",
          variant: "light",
          label: "Edit",
          icon: "i-ph-pencil-simple",
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          size: "sm",
          variant: "light",
          color: "error",
          label: "Hapus",
          icon: "i-ph-trash",
          onClick: () => confirmDelete(row.original.id),
        }),
      ]),
  },
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

    <UModal
      v-model:open="isModalOpen"
      :title="editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Judul" required>
            <UInput v-model="form.title" class="w-full" />
          </UFormField>

          <UFormField label="Foto" required>
            <div class="rounded-lg border-2 border-dashed p-4 text-center">
              <img
                v-if="uploadPreview"
                :src="uploadPreview"
                alt="Preview"
                class="mx-auto mb-3 max-h-48 rounded object-contain"
              />
              <label class="cursor-pointer">
                <span class="text-sm text-primary">{{
                  uploadPreview ? "Ganti foto" : "Pilih foto"
                }}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  @change="onFileChange"
                />
              </label>
              <p class="mt-1 text-xs text-muted">JPG, PNG, WebP · Maks 5MB</p>
            </div>
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" class="w-full" :rows="3" />
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

    <UModal v-model:open="isDeleteModalOpen" title="Hapus Kegiatan">
      <template #body>
        <p class="text-sm">
          Apakah kamu yakin ingin menghapus kegiatan ini? Tindakan ini tidak
          bisa dibatalkan.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            label="Batal"
            @click="isDeleteModalOpen = false"
          />
          <UButton
            color="error"
            label="Hapus"
            :loading="deleting"
            @click="doDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
