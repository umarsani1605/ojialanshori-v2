<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "reviewer",
});

type QueuePost = {
  id: number;
  title: string;
  slug: string;
  updatedAt: string;
  author: { id: number; fullname: string };
  category: { id: number; name: string; type: "berita" | "pena_santri" } | null;
};

const PAGE_SIZE = 10;
const page = ref(1);

const { data, status } = useLazyFetch<{ data: QueuePost[] }>(
  "/api/posts",
  { key: "dashboard-review-queue" },
);

const posts = computed(() => data.value?.data ?? []);
const total = computed(() => posts.value.length);

const paginatedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return posts.value.slice(start, start + PAGE_SIZE);
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const columns: TableColumn<QueuePost>[] = [
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
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) =>
      row.original.category
        ? h(UBadge, {
            label: row.original.category.name,
            color:
              row.original.category.type === "berita" ? "info" : "secondary",
            variant: "subtle",
          })
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "updatedAt",
    header: "Dikirim",
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
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) =>
      h(UButton, {
        label: "Buka",
        size: "sm",
        color: "primary",
        variant: "outline",
        to: `/dashboard/posts/${row.original.id}/edit`,
      }),
  },
];
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-xl font-semibold">Antrian Review</h1>
      <p class="text-muted text-sm mt-1">
        Artikel yang menunggu persetujuan sebelum dipublish.
      </p>
    </div>

    <UTable
      :data="paginatedPosts"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #empty>
        <div class="py-12 text-center">
          <p class="text-muted">Tidak ada artikel yang menunggu review.</p>
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
