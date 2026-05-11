<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { h, resolveComponent } from "vue";

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

const { data, status } = await useFetch<{ data: QueuePost[] }>("/api/posts", {
  key: "dashboard-review-queue",
});

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
      h("div", { class: "min-w-0" }, [
        h("p", { class: "text-sm" }, row.original.title),
      ]),
  },
  {
    accessorKey: "author",
    header: "Penulis",
    cell: ({ row }) => h("span", { class: "text-sm" }, row.original.author.fullname),
  },
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm" },
        row.original.category?.name ?? "Belum dipilih",
      ),
  },
  {
    accessorKey: "updatedAt",
    header: "Dikirim",
    size: 200,
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm text-slate-500" },
        formatDatetime(row.original.updatedAt),
      ),
  },
  {
    id: "actions",
    size: 90,
    header: () => h("div", { class: "text-right" }, "Aksi"),
    cell: ({ row }) =>
      h("div", { class: "flex justify-end" }, [
        h(UButton, {
          label: "Review",
          icon: 'i-ph-pencil-simple-duotone',
          size: "sm",
          variant: "light",
          to: `/dashboard/posts/${row.original.id}/edit`,
        }),
      ]),
  },
];
</script>

<template>
  <UContainer>
    <UCard class="flex flex-col min-h-[800px]" :ui="{ body: 'pt-4! flex-1 flex flex-col' }">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-semibold">Review Artikel</h1>
        </div>
      </template>

      <div v-if="status === 'pending'" class="flex items-center justify-center py-16">
        <UIcon name="i-ph-spinner-gap" class="text-2xl text-dimmed animate-spin" />
      </div>
      <div v-else-if="paginatedPosts.length === 0" class="py-32 text-center text-sm text-dimmed">
        <UIcon name="i-ph-folder-open-duotone" class="text-primary w-12 h-12 mb-4" />
        <div>Tidak ada artikel yang menunggu review.</div>
      </div>
      <UTable v-else :data="paginatedPosts" :columns="columns" :ui="{ base: 'min-w-full table-fixed overflow-clip' }" />

      <DashboardTablePagination v-if="total > 0" class="mt-auto" :page="page" :total="total"
        @update:page="page = $event" />
    </UCard>
  </UContainer>
</template>
