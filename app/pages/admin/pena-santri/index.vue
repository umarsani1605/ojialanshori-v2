<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { h } from "vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Pena Santri",
});

import type { AdminPost, PostStatus } from "~~/shared/types";

type SelectItem = {
  label: string;
  value: string;
};

import {
  POST_STATUS_COLOR_MAP as STATUS_COLOR,
  POST_STATUS_LABEL_MAP as STATUS_LABEL,
  POST_STATUS_OPTIONS as STATUS_OPTIONS,
} from "~/constants/postStatus";

const toast = useToast();
const search = ref("");
const statusFilter = ref<PostStatus | undefined>(undefined);
const authorFilter = ref<string | undefined>(undefined);
const categoryFilter = ref<string | undefined>(undefined);

const isFiltered = computed(
  () =>
    search.value !== "" ||
    statusFilter.value !== undefined ||
    authorFilter.value !== undefined ||
    categoryFilter.value !== undefined,
);

function resetFilters() {
  search.value = "";
  statusFilter.value = undefined;
  authorFilter.value = undefined;
  categoryFilter.value = undefined;
}

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>(
  "/api/posts",
  { key: "admin-posts-list-pena-santri" },
);

const posts = computed(() =>
  (data.value?.data ?? []).filter(
    (post) => post.category?.type === "pena_santri" || !post.category,
  ),
);

const authorOptions = computed<SelectItem[]>(() => {
  const authors = new Map<number, string>();

  for (const post of posts.value) {
    authors.set(post.author.id, post.author.fullname);
  }

  return Array.from(authors.entries()).map(([id, name]) => ({
    label: name,
    value: String(id),
  }));
});

const categoryOptions = computed<SelectItem[]>(() => {
  const categories = new Map<number, string>();

  for (const post of posts.value) {
    if (post.category) {
      categories.set(post.category.id, post.category.name);
    }
  }

  return Array.from(categories.entries()).map(([id, name]) => ({
    label: name,
    value: String(id),
  }));
});

const filteredPosts = computed(() => {
  const query = search.value.trim().toLowerCase();

  return posts.value.filter((post) => {
    if (statusFilter.value && post.status !== statusFilter.value) {
      return false;
    }

    if (authorFilter.value && String(post.author.id) !== authorFilter.value) {
      return false;
    }

    if (
      categoryFilter.value &&
      String(post.category?.id ?? "") !== categoryFilter.value
    ) {
      return false;
    }

    if (query && !post.title.toLowerCase().includes(query)) {
      return false;
    }

    return true;
  });
});

const total = computed(() => filteredPosts.value.length);

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
    await $fetch(`/api/posts/${deletingId.value}`, { method: "DELETE" });
    toast.add({
      title: "Artikel dihapus",
      color: "success",
      icon: "i-ph-check-circle",
    });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    toast.add({
      title: "Gagal menghapus artikel",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const columns: TableColumn<AdminPost>[] = [
  imageColumn<AdminPost>({
    accessorKey: "featuredImage",
    header: "Gambar",
    alt: (row) => row.title,
  }),
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) =>
      h("span", { class: "font-medium line-clamp-2" }, row.original.title),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    cell: ({ row }) => h("span", {}, row.original.author.fullname),
  },
  badgeColumn<AdminPost, PostStatus>({
    accessorKey: "status",
    colorMap: STATUS_COLOR,
    labelMap: STATUS_LABEL,
  }),
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) =>
      row.original.category
        ? h("span", {}, row.original.category.name)
        : h("span", { class: "text-muted" }, "Belum dipilih"),
  },
  {
    accessorKey: "updatedAt",
    header: "Diperbarui",
    cell: ({ row }) =>
      h("span", { class: "text-muted text-sm" }, formatDatetime(row.original.updatedAt)),
  },
  actionsColumn<AdminPost>({
    editTo: (row) => `/admin/pena-santri/${row.id}/edit`,
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <AdminDataTable v-model:search="search" :data="filteredPosts" :columns="columns" :loading="status === 'pending'"
    search-placeholder="Cari judul artikel…">
    <template #toolbar-left>
      <USelect v-model="authorFilter" :items="authorOptions" value-key="value" label-key="label"
        placeholder="Semua penulis" class="w-48" />
      <USelect v-model="categoryFilter" :items="categoryOptions" value-key="value" label-key="label"
        placeholder="Semua kategori" class="w-48" />
      <USelect v-model="statusFilter" :items="STATUS_OPTIONS" value-key="value" label-key="label"
        placeholder="Semua status" class="w-48" />
      <UButton v-if="isFiltered" variant="link" color="neutral" icon="i-ph-x" label="Reset" @click="resetFilters" />
    </template>

    <template #toolbar-right>
      <UButton label="Tulis Artikel" icon="i-ph-plus-bold" to="/admin/pena-santri/create" />
    </template>

    <template #empty>
      <div class="py-12 text-center">
        <p class="text-muted">Tidak ada artikel pena santri ditemukan.</p>
      </div>
    </template>
  </AdminDataTable>

  <AdminDeleteConfirmModal
    v-model:open="isDeleteModalOpen"
    title="Hapus Artikel"
    description="Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa dibatalkan."
    :loading="deleting"
    @confirm="doDelete"
  />
</template>
