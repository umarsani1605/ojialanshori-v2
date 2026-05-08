<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Artikel",
});

type AdminPost = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  updatedAt: string;
  publishedAt: string | null;
  author: { id: number; fullname: string };
  category: { id: number; name: string; type: "berita" | "pena_santri" } | null;
};

const STATUS_OPTIONS = [
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

const toast = useToast();

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>(
  "/api/posts",
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
    const msg =
      (e as { data?: { message?: string } }).data?.message ??
      (e as Error).message ??
      "Terjadi kesalahan.";
    toast.add({ title: "Gagal menghapus", description: msg, color: "error", icon: "i-ph-x-circle" });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

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
        }),
      ),
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "flex gap-1 justify-end" }, [
        h(UButton, {
          size: "sm",
          color: "neutral",
          variant: "light",
          icon: "i-ph-pencil-simple",
          to:
            row.original.category?.type === "berita"
              ? `/admin/berita/${row.original.id}/edit`
              : `/admin/pena-santri/${row.original.id}/edit`,
        }),
        h(UButton, {
          size: "sm",
          variant: "light",
          color: "error",
          icon: "i-ph-trash",
          onClick: () => confirmDelete(row.original.id),
        }),
      ]),
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <USelect
          v-model="statusFilter"
          :items="STATUS_OPTIONS"
          value-key="value"
          label-key="label"
          placeholder="Semua status"
          class="w-44"
        />
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable
        :data="paginatedPosts"
        :columns="columns"
        :loading="status === 'pending'"
      >
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
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="PAGE_SIZE"
          size="sm"
          variant="ghost"
        />
      </div>
    </template>
  </UCard>

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Artikel">
    <template #body>
      <p class="text-sm">
        Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa dibatalkan.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" @click="isDeleteModalOpen = false" />
        <UButton color="error" label="Hapus" :loading="deleting" @click="doDelete" />
      </div>
    </template>
  </UModal>
</template>
