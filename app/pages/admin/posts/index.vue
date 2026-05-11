<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { h } from "vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Artikel",
});

import type { AdminPost, PostStatus } from "~~/shared/types";

import {
  POST_STATUS_COLOR_MAP as STATUS_COLOR,
  POST_STATUS_LABEL_MAP as STATUS_LABEL,
  POST_STATUS_OPTIONS as STATUS_OPTIONS,
} from "~/constants/postStatus";

const PAGE_SIZE = 10;
const page = ref(1);
const statusFilter = ref<PostStatus | undefined>(undefined);

const toast = useToast();

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>(
  "/api/posts",
  { key: "admin-posts-list-all" },
);

const posts = computed(() => data.value?.data ?? []);

const filteredPosts = computed(() => {
  if (!statusFilter.value) return posts.value;
  return posts.value.filter((p) => p.status === statusFilter.value);
});

const total = computed(() => filteredPosts.value.length);

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredPosts.value.slice(start, start + PAGE_SIZE);
});

watch(statusFilter, () => {
  page.value = 1;
});

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
    toast.add({ title: "Artikel dihapus", color: "success", icon: "i-ph-check-circle" });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: "Gagal menghapus", description: errorMessage(e), color: "error", icon: "i-ph-x-circle" });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const columns: TableColumn<AdminPost>[] = [
  {
    id: "index",
    header: "No",
    size: 56,
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm tabular-nums text-muted" },
        String((page.value - 1) * PAGE_SIZE + row.index + 1),
      ),
  },
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
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "updatedAt",
    header: "Diperbarui",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-muted text-sm" },
        new Date(row.original.updatedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      ),
  },
  actionsColumn<AdminPost>({
    editTo: (row) =>
      row.category?.type === "berita"
        ? `/admin/berita/${row.id}/edit`
        : `/admin/pena-santri/${row.id}/edit`,
    onDelete: (row) => confirmDelete(row.id),
  }),
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <USelect v-model="statusFilter" :items="STATUS_OPTIONS" value-key="value" label-key="label"
          placeholder="Semua status" class="w-44" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable :data="paginatedPosts" :columns="columns" :loading="status === 'pending'">
        <template #empty>
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada artikel ditemukan.</p>
          </div>
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-muted shrink-0">Total {{ total }} artikel</p>
        <UPagination v-model:page="page" :total="total" :items-per-page="PAGE_SIZE" size="sm" variant="ghost" />
      </div>
    </template>
  </UCard>

  <AdminDeleteConfirmModal
    v-model:open="isDeleteModalOpen"
    title="Hapus Artikel"
    description="Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa dibatalkan."
    :loading="deleting"
    @confirm="doDelete"
  />
</template>
