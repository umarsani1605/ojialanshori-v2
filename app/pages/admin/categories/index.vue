<script setup lang="ts">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { CategoryDto } from "~~/shared/types";

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Kategori',
})

type Category = Pick<CategoryDto, "id" | "name">;

const toast = useToast();

const { data, refresh } = useLazyFetch<{ data: Category[] }>("/api/categories", {
  key: "admin-categories-list",
});
const categories = computed(() => data.value?.data ?? []);
const search = ref("");

const filteredCategories = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return categories.value;
  return categories.value.filter((category) =>
    category.name.toLowerCase().includes(query),
  );
});

const isModalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: "" });
const saving = ref(false);

const isDeleteModalOpen = ref(false);
const deletingId = ref<number | null>(null);
const deleting = ref(false);

function openCreate() {
  editingId.value = null;
  form.name = "";
  isModalOpen.value = true;
}

function openEdit(category: Category) {
  editingId.value = category.id;
  form.name = category.name;
  isModalOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    const body = { name: form.name };
    if (editingId.value !== null) {
      await $fetch(`/api/categories/${editingId.value}`, {
        method: "PATCH",
        body,
      });
      toast.add({
        title: "Kategori diperbarui",
        color: "success",
        icon: "i-ph-check-circle",
      });
    } else {
      await $fetch("/api/categories", { method: "POST", body });
      toast.add({
        title: "Kategori ditambahkan",
        color: "success",
        icon: "i-ph-check-circle",
      });
    }
    isModalOpen.value = false;
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

function confirmDelete(id: number) {
  deletingId.value = id;
  isDeleteModalOpen.value = true;
}

async function doDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await $fetch(`/api/categories/${deletingId.value}`, { method: "DELETE" });
    toast.add({
      title: "Kategori dihapus",
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

const columns: TableColumn<Category>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.name),
  },
  actionsColumn<Category>({
    onEdit: (row) => openEdit(row),
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <AdminDataTable
    :data="filteredCategories"
    :columns="columns"
    :index-column-size="44"
  >
    <template #toolbar-left>
      <UInput
        v-model="search"
        placeholder="Cari kategori…"
        icon="i-ph-magnifying-glass-bold"
        class="w-56"
      />
    </template>
    <template #toolbar-right>
      <UButton
        label="Tambah Kategori"
        icon="i-ph-plus-bold"
        @click="openCreate"
      />
    </template>
  </AdminDataTable>

  <AdminFormModal
    v-model:open="isModalOpen"
    :is-edit="!!editingId"
    entity-label="Kategori"
    :loading="saving"
    @submit="save"
  >
    <UFormField label="Nama" required>
      <UInput v-model="form.name" placeholder="Nama kategori" class="w-full" />
    </UFormField>
  </AdminFormModal>

  <AdminDeleteConfirmModal
    v-model:open="isDeleteModalOpen"
    title="Hapus Kategori"
    description="Apakah kamu yakin ingin menghapus kategori ini? Kategori tidak bisa dihapus jika masih digunakan oleh artikel."
    :loading="deleting"
    @confirm="doDelete"
  />
</template>
