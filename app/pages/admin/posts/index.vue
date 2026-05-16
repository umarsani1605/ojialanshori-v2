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

const sortedPosts = computed(() => [...filteredPosts.value]);
const total = computed(() => sortedPosts.value.length);

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return sortedPosts.value.slice(start, start + PAGE_SIZE);
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
  } catch (error: unknown) {
    toast.add({ title: "Gagal menghapus", description: errorMessage(error), color: "error", icon: "i-ph-x-circle" });
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
    minSize: 56,
    maxSize: 56,
    meta: {
      class: {
        td: "align-top",
      },
      style: {
        th: {
          width: "56px",
          minWidth: "56px",
          maxWidth: "56px",
        },
        td: {
          width: "56px",
          minWidth: "56px",
          maxWidth: "56px",
        },
      },
    },
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
    meta: {
      class: {
        th: "w-[28rem]",
        td: "w-[28rem] align-top",
      },
    },
    cell: ({ row }) =>
      h(
        "div",
        { class: "min-w-0 max-w-[28rem] whitespace-normal break-words" },
        [h("span", { class: "font-medium line-clamp-2" }, row.original.title)],
      ),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    size: 180,
    meta: {
      class: {
        th: "w-[180px]",
        td: "w-[180px] align-top",
      },
    },
    cell: ({ row }) => h("span", { class: "whitespace-normal break-words" }, row.original.author.fullname),
  },
  badgeColumn<AdminPost, PostStatus>({
    accessorKey: "status",
    colorMap: STATUS_COLOR,
    labelMap: STATUS_LABEL,
  }),
  {
    accessorKey: "category",
    header: "Kategori",
    size: 180,
    meta: {
      class: {
        th: "w-[180px]",
        td: "w-[180px] align-top",
      },
    },
    cell: ({ row }) =>
      row.original.category
        ? h("span", { class: "whitespace-normal break-words" }, row.original.category.name)
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "updatedAt",
    header: "Diperbarui",
    size: 140,
    minSize: 140,
    maxSize: 140,
    meta: {
      class: {
        th: "w-[140px]",
        td: "w-[140px] align-top",
      },
    },
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-muted text-sm whitespace-nowrap" },
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
