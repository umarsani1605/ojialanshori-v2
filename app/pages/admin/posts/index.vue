<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
});

type AdminPost = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  updatedAt: string;
  publishedAt: string | null;
  author: { id: number; name: string };
  category: { id: number; name: string; type: "berita" | "pena_santri" } | null;
};

type AdminPostsResponse = {
  data: AdminPost[];
  total: number;
  page: number;
  limit: number;
};

const STATUS_OPTIONS = [
  { label: "Semua", value: "" },
  { label: "Terbit", value: "published" },
  { label: "Dalam Ulasan", value: "pending_review" },
  { label: "Draft", value: "draft" },
  { label: "Ditolak", value: "rejected" },
];

const STATUS_COLOR: Record<
  string,
  "success" | "warning" | "neutral" | "error"
> = {
  published: "success",
  pending_review: "warning",
  draft: "neutral",
  rejected: "error",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Terbit",
  pending_review: "Dalam Ulasan",
  draft: "Draft",
  rejected: "Ditolak",
};

const PAGE_SIZE = 10;
const page = ref(1);
const statusFilter = ref("");

watch(statusFilter, () => {
  page.value = 1;
});

const { data, status } = await useFetch<AdminPostsResponse>("/api/admin/posts", {
  key: "admin-posts",
  query: computed(() => ({
    page: page.value,
    limit: PAGE_SIZE,
    ...(statusFilter.value ? { status: statusFilter.value } : {}),
  })),
  watch: [page, statusFilter],
});

const posts = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);

const UBadge = resolveComponent("UBadge");

const columns: TableColumn<AdminPost>[] = [
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) =>
      h("span", { class: "font-medium line-clamp-2" }, row.original.title),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    cell: ({ row }) => h("span", {}, row.original.author.name),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      h(UBadge, {
        label: STATUS_LABEL[row.original.status] ?? row.original.status,
        color: STATUS_COLOR[row.original.status] ?? "neutral",
        variant: "subtle",
      }),
  },
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
        })
      ),
  },
];
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Semua Artikel</h1>
        <p class="text-muted text-sm mt-1">
          Seluruh artikel dari semua penulis.
        </p>
      </div>
      <USelect
        v-model="statusFilter"
        :items="STATUS_OPTIONS"
        value-key="value"
        label-key="label"
        class="w-44"
      />
    </div>

    <UTable
      :data="posts"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #empty>
        <div class="py-12 text-center">
          <p class="text-muted">Tidak ada artikel ditemukan.</p>
        </div>
      </template>
    </UTable>

    <div v-if="total > PAGE_SIZE" class="flex justify-center">
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="PAGE_SIZE"
      />
    </div>
  </div>
</template>
