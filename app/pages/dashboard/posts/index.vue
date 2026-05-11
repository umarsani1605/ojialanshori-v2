<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { h, resolveComponent } from "vue";

definePageMeta({
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "santri",
});

type StatusFilter = "" | "published" | "pending_review" | "rejected" | "draft";

type PostRow = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  categoryName: string | null;
  categoryType: "berita" | "pena_santri" | null;
};

type ListResponse = { data: PostRow[] };

const toast = useToast();

const PAGE_SIZE = 10;

const activeStatus = ref<StatusFilter>("");
const page = ref(1);

watch(activeStatus, () => {
  page.value = 1;
});

const { data, status, refresh } = useLazyFetch<ListResponse>("/api/posts", {
  key: "dashboard-santri-posts",
});

const allPosts = computed(() => data.value?.data ?? []);

const counts = computed(() => ({
  all: allPosts.value.length,
  published: allPosts.value.filter((p) => p.status === "published").length,
  pendingReview: allPosts.value.filter((p) => p.status === "pending_review")
    .length,
  rejected: allPosts.value.filter((p) => p.status === "rejected").length,
  draft: allPosts.value.filter((p) => p.status === "draft").length,
}));

function filteredPostsForTab(tabValue: string) {
  if (!tabValue) return allPosts.value;
  return allPosts.value.filter((p) => p.status === tabValue);
}

function postsForTab(tabValue: string) {
  const filtered = filteredPostsForTab(tabValue);
  const start = (page.value - 1) * PAGE_SIZE;
  return filtered.slice(start, start + PAGE_SIZE);
}

function totalForTab(tabValue: string) {
  return filteredPostsForTab(tabValue).length;
}

const deleteTarget = ref<PostRow | null>(null);
const deleteModalOpen = ref(false);
const deleting = ref(false);

const tabs = computed(() => [
  { label: "Semua", value: "", slot: "all" },
  {
    label: "Terbit",
    value: "published",
    slot: "published",
  },
  {
    label: "Dalam Review",
    value: "pending_review",
    slot: "pending_review",
  },
  {
    label: "Ditolak",
    value: "rejected",
    slot: "rejected",
  },
  { label: "Draft", value: "draft", slot: "draft" },
]);

function getStatusColor(status: PostRow["status"]) {
  return {
    published: "success",
    pending_review: "warning",
    rejected: "error",
    draft: "neutral",
  }[status] as "success" | "warning" | "error" | "neutral";
}

function getStatusLabel(status: PostRow["status"]) {
  return {
    published: "Terbit",
    pending_review: "Dalam Review",
    rejected: "Ditolak",
    draft: "Draft",
  }[status];
}

function getPublicPath(row: PostRow) {
  return row.categoryType === "berita" ? "/berita" : "/pena-santri";
}

function openDeleteModal(row: PostRow) {
  deleteTarget.value = row;
  deleteModalOpen.value = true;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;

  deleting.value = true;
  try {
    await $fetch(`/api/posts/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Artikel dihapus",
      color: "success",
      icon: "i-ph-check",
    });
    deleteTarget.value = null;
    deleteModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.add({
      title: "Gagal menghapus artikel",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-warning-circle",
    });
  } finally {
    deleting.value = false;
  }
}

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const columns: TableColumn<PostRow>[] = [
  {
    accessorKey: "title",
    header: "Judul Artikel",
    cell: ({ row }) => {
      const post = row.original;
      return h("div", { class: "min-w-0" }, [
        h("p", { class: "text-sm" }, post.title),
      ]);
    },
  },
  {
    accessorKey: "categoryName",
    header: "Kategori",
    size: 160,
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm" },
        row.original.categoryName ?? "Belum dipilih",
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
          variant: "subtle",
        },
        () => getStatusLabel(row.original.status),
      ),
  },
  {
    accessorKey: "updatedAt",
    header: "Tanggal",
    size: 200,
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm text-muted" },
        formatDatetime(row.original.updatedAt),
      ),
  },
  {
    id: "actions",
    size: 90,
    header: () => h("div", { class: "text-right" }, "Aksi"),
    cell: ({ row }) => {
      const post = row.original;

      const actions = [
        h(UButton, {
          to: `/dashboard/posts/${post.id}/edit`,
          icon: "ph:pencil-simple",
          variant: "light",
          size: "sm",
        }),
        h(UButton, {
          icon: "ph:trash",
          variant: "light",
          color: "error",
          size: "sm",
          onClick: () => openDeleteModal(post),
        }),
      ];

      return h("div", { class: "flex justify-end gap-1" }, actions);
    },
  },
];
</script>

<template>
  <UContainer>
    <UCard class="flex flex-col min-h-[800px]" :ui="{ body: 'pt-4! flex-1 flex flex-col' }">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-semibold">Artikel Saya</h1>
          <UButton to="/dashboard/posts/create" icon="i-ph-plus" size="sm">
            Tulis Artikel
          </UButton>
        </div>
      </template>

      <UTabs v-model="activeStatus" :items="tabs" variant="link" class="w-full">
        <template v-for="tab in tabs" :key="tab.slot" #[tab.slot]>
          <div v-if="status === 'pending'" class="flex items-center justify-center py-16">
            <UIcon name="i-ph-spinner-gap" class="text-2xl text-dimmed animate-spin" />
          </div>
          <div v-else-if="postsForTab(tab.value).length === 0" class="py-32 text-center text-sm text-dimmed">
            <UIcon name="i-ph-folder-open-duotone" class="text-primary w-12 h-12 mb-4" />
            <div>Tidak ada artikel.</div>
          </div>
          <UTable v-else :data="postsForTab(tab.value)" :columns="columns"
            :ui="{ base: 'min-w-full table-fixed overflow-clip' }" />
        </template>
      </UTabs>

      <DashboardTablePagination v-if="totalForTab(activeStatus) > 0" class="mt-auto" :page="page"
        :total="totalForTab(activeStatus)" @update:page="page = $event" />
    </UCard>
  </UContainer>

  <UModal v-model:open="deleteModalOpen" title="Hapus Artikel?">
    <template #body>
      <p class="text-sm">
        Apakah kamu yakin ingin menghapus artikel ini? Tindakan ini tidak bisa
        dibatalkan.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="outline" :disabled="deleting" @click="
          deleteModalOpen = false;
        deleteTarget = null;
        ">
          Batal
        </UButton>
        <UButton color="error" :loading="deleting" @click="confirmDelete">
          Hapus
        </UButton>
      </div>
    </template>
  </UModal>
</template>
