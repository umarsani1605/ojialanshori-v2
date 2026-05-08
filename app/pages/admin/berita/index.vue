<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Berita",
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

const toast = useToast();
const search = ref("");
const statusFilter = ref<string | undefined>();

const { data, status, refresh } = useLazyFetch<{ data: AdminPost[] }>(
  "/api/posts",
);

const posts = computed(() =>
  (data.value?.data ?? []).filter((post) => post.category?.type === "berita"),
);

const filteredPosts = computed(() => {
  const query = search.value.trim().toLowerCase();

  return posts.value.filter((post) => {
    if (statusFilter.value && post.status !== statusFilter.value) {
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
      title: "Berita dihapus",
      color: "success",
      icon: "i-ph-check-circle",
    });
    isDeleteModalOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as { data?: { message?: string } }).data?.message ??
      (error as Error).message ??
      "Terjadi kesalahan.";

    toast.add({
      title: "Gagal menghapus berita",
      description: message,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    deleting.value = false;
    deletingId.value = null;
  }
}

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const columns: TableColumn<AdminPost>[] = [
  {
    accessorKey: "title",
    header: "Judul",
    cell: ({ row }) =>
      h("span", { class: "font-medium line-clamp-2" }, row.original.title),
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
    accessorKey: "updatedAt",
    header: "Diperbarui",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-muted text-sm" },
        formatDatetime(row.original.updatedAt),
      ),
  },
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "flex gap-1 justify-end" }, [
        h(UButton, {
          size: "sm",
          variant: "light",
          label: "Edit",
          icon: "i-ph-pencil-simple",
          to: `/admin/berita/${row.original.id}/edit`,
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
  <AdminDataTable
    v-model:search="search"
    :data="filteredPosts"
    :columns="columns"
    :loading="status === 'pending'"
    search-placeholder="Cari judul berita…"
  >
    <template #toolbar-left>
      <USelect
        v-model="statusFilter"
        :items="STATUS_OPTIONS"
        value-key="value"
        label-key="label"
        placeholder="Semua status"
        class="w-48"
      />
    </template>

    <template #toolbar-right>
      <UButton
        label="Tulis Berita"
        icon="i-ph-plus-bold"
        to="/admin/berita/create"
      />
    </template>

    <template #empty>
      <div class="py-12 text-center">
        <p class="text-muted">Tidak ada berita ditemukan.</p>
      </div>
    </template>
  </AdminDataTable>

  <UModal v-model:open="isDeleteModalOpen" title="Hapus Berita">
    <template #body>
      <p class="text-sm">
        Apakah kamu yakin ingin menghapus berita ini? Tindakan ini tidak bisa
        dibatalkan.
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
</template>
