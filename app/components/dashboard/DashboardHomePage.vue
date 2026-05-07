<script setup lang="ts">
type ReviewerDashboardStats = {
  type: "personal";
  totalPosts: number;
  publishedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
  draftPosts: number;
  recentPosts: Array<{
    id: number;
    title: string;
    slug: string;
    status: "draft" | "pending_review" | "published" | "rejected";
    reviewNote: string | null;
    createdAt: string;
  }>;
};

type SantriDashboardStats = {
  total: number;
  published: number;
  pendingReview: number;
  rejected: number;
  latestApprovedPost: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string | Date | null;
    categoryType: "berita" | "pena_santri";
  } | null;
};

type SantriMyPost = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  publishedAt: string | Date | null;
  createdAt: string | Date;
  categoryName: string | null;
};

type SantriFeedPost = {
  id: number;
  title: string;
  slug: string;
  featuredImage: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  categoryName: string;
  categoryType: "berita" | "pena_santri";
  authorName: string;
};

const auth = useAuth();
const greeting = ref("");
const approvedAlertDismissed = ref(false);

const {
  data: reviewerStats,
  status: reviewerStatus,
  refresh: refreshReviewerStats,
} = await useFetch<ReviewerDashboardStats>("/api/stats", {
  key: `dashboard-reviewer-stats-${auth.user.value?.id}`,
  immediate: auth.isReviewer.value,
});

const {
  data: santriStats,
  status: santriStatsStatus,
  refresh: refreshSantriStats,
} = await useFetch<SantriDashboardStats>("/api/posts/stats", {
  key: `dashboard-santri-stats-${auth.user.value?.id}`,
  immediate: auth.isSantri.value,
});

const {
  data: santriMyPosts,
  status: santriMyPostsStatus,
  refresh: refreshSantriMyPosts,
} = await useFetch<{ data: SantriMyPost[] }>("/api/posts/my-posts", {
  key: `dashboard-santri-my-posts-${auth.user.value?.id}`,
  immediate: auth.isSantri.value,
});

const {
  data: santriFeed,
  status: santriFeedStatus,
  refresh: refreshSantriFeed,
} = await useFetch<{ data: SantriFeedPost[] }>("/api/posts/feed", {
  key: `dashboard-santri-feed-${auth.user.value?.id}`,
  immediate: auth.isSantri.value,
});

const latestApprovedPost = computed(
  () => santriStats.value?.latestApprovedPost ?? null,
);
const santriLoading = computed(
  () =>
    santriStatsStatus.value === "pending" ||
    santriMyPostsStatus.value === "pending" ||
    santriFeedStatus.value === "pending",
);
const santriError = computed(
  () =>
    santriStatsStatus.value === "error" ||
    santriMyPostsStatus.value === "error" ||
    santriFeedStatus.value === "error",
);
const showApprovedAlert = computed(
  () => Boolean(latestApprovedPost.value) && !approvedAlertDismissed.value,
);

const statItems = computed(() => [
  {
    label: "Total Artikel",
    value: santriStats.value?.total ?? 0,
    icon: "ph:note-pencil-duotone",
    color: "blue" as const,
  },
  {
    label: "Terbit",
    value: santriStats.value?.published ?? 0,
    icon: "ph:check-circle-duotone",
    color: "green" as const,
  },
  {
    label: "Dalam Ulasan",
    value: santriStats.value?.pendingReview ?? 0,
    icon: "ph:clock-duotone",
    color: "amber" as const,
  },
  {
    label: "Ditolak",
    value: santriStats.value?.rejected ?? 0,
    icon: "ph:x-circle-duotone",
    color: "red" as const,
  },
]);

const recentMyPosts = computed(() =>
  (santriMyPosts.value?.data ?? []).slice(0, 4),
);
const recentFeedPosts = computed(() =>
  (santriFeed.value?.data ?? []).slice(0, 4),
);

const hour = new Date().getHours();

if (hour < 10) greeting.value = "Selamat pagi";
else if (hour < 15) greeting.value = "Selamat siang";
else if (hour < 18) greeting.value = "Selamat sore";
else greeting.value = "Selamat malam";

watch(
  latestApprovedPost,
  (post) => {
    if (!import.meta.client) {
      return;
    }

    if (!post) {
      approvedAlertDismissed.value = true;
      return;
    }

    approvedAlertDismissed.value =
      window.localStorage.getItem(getApprovedAlertStorageKey(post)) === "1";
  },
  { immediate: true },
);

async function refreshDashboard() {
  if (auth.isSantri.value) {
    await Promise.all([
      refreshSantriStats(),
      refreshSantriMyPosts(),
      refreshSantriFeed(),
    ]);
    return;
  }

  await refreshReviewerStats();
}

async function openApprovedPost() {
  if (latestApprovedPost.value && import.meta.client) {
    window.localStorage.setItem(
      getApprovedAlertStorageKey(latestApprovedPost.value),
      "1",
    );
    approvedAlertDismissed.value = true;
  }

  await navigateTo(
    latestApprovedPost.value?.categoryType === "berita"
      ? "/berita"
      : "/pena-santri",
  );
}

function getApprovedAlertStorageKey(
  post: NonNullable<SantriDashboardStats["latestApprovedPost"]>,
) {
  return `dashboard-approved-alert:${post.id}:${String(post.publishedAt)}`;
}


function getPostStatusTone(status: SantriMyPost["status"]) {
  return {
    draft: "neutral",
    pending_review: "warning",
    published: "success",
    rejected: "error",
  }[status] as "neutral" | "warning" | "success" | "error";
}

function getPostStatusLabel(status: SantriMyPost["status"]) {
  return {
    draft: "Draft",
    pending_review: "Dalam Ulasan",
    published: "Terbit",
    rejected: "Rejected",
  }[status];
}
</script>

<template>
  <UContainer class="space-y-6">
    <template v-if="auth.isSantri.value">
      <UCard>
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold">
            {{ greeting }}, {{ auth.user.value?.name?.split(" ")[0] }}! 👋🏻
          </h1>
          <p class="text-muted">
            Pantau status tulisanmu dan lanjutkan proses menulis dari sini.
          </p>
        </div>
        <div class="mt-4">
          <UButton to="/dashboard/posts/create" icon="i-lucide-pen-line">
            Tulis Artikel
          </UButton>
        </div>
      </UCard>

      <template v-if="santriLoading">
        <UCard>
          <div class="flex items-center justify-center py-10">
            <UIcon
              name="i-lucide-loader-circle"
              class="animate-spin text-2xl text-dimmed"
            />
          </div>
        </UCard>
      </template>

      <template v-else-if="santriError">
        <UAlert
          color="error"
          variant="subtle"
          title="Dashboard belum bisa dimuat"
          description="Coba muat ulang data dashboard santri."
        >
          <template #actions>
            <UButton color="error" variant="link" @click="refreshDashboard()">
              Coba lagi
            </UButton>
          </template>
        </UAlert>
      </template>

      <template v-else>
        <UAlert
          v-if="showApprovedAlert"
          color="success"
          variant="subtle"
          :title="`Artikel '${latestApprovedPost?.title}' sudah disetujui`"
          description="Artikel tersebut sudah masuk ke listing publik."
        >
          <template #actions>
            <UButton color="success" variant="link" @click="openApprovedPost()">
              Lihat
            </UButton>
          </template>
        </UAlert>

        <UAlert
          v-else-if="(santriStats?.rejected ?? 0) > 0"
          color="warning"
          variant="subtle"
          :title="`${santriStats?.rejected} artikel perlu diperbaiki`"
          description="Buka daftar artikel untuk melihat catatan reviewer."
        >
          <template #actions>
            <UButton
              to="/dashboard/posts?status=rejected"
              color="warning"
              variant="link"
            >
              Buka daftar
            </UButton>
          </template>
        </UAlert>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            v-for="item in statItems"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :icon="item.icon"
            :color="item.color"
          />
        </div>

        <div
          class="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        >
          <UCard class="flex flex-col" :ui="{ body: 'pt-4! flex-1' }">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="font-semibold">Artikel Saya</h2>
                </div>
                <NuxtLink
                  to="/dashboard/posts"
                  class="text-sm text-dimmed hover:text-slate-600 transition-colors"
                >
                  Lihat Semua
                </NuxtLink>
              </div>
            </template>

            <div
              v-if="recentMyPosts.length === 0"
              class="w-full h-full flex items-center justify-center text-dimmed"
            >
              Belum ada artikel yang ditulis.
            </div>

            <div v-else class="space-y-4">
              <DashboardFeedPostCard
                v-for="post in recentMyPosts"
                :key="post.id"
                :to="`/dashboard/posts/${post.id}`"
                :title="post.title"
                :category="post.categoryName ?? 'Belum pilih kategori'"
                :date="post.publishedAt ?? post.createdAt"
              >
                <template #trailing>
                  <UBadge
                    :color="getPostStatusTone(post.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ getPostStatusLabel(post.status) }}
                  </UBadge>
                </template>
              </DashboardFeedPostCard>
            </div>
          </UCard>

          <UCard class="flex flex-col" :ui="{ body: 'pt-4! flex-1' }">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-semibold">Terbaru di Pena Santri</h2>
                <NuxtLink
                  to="/pena-santri"
                  class="text-sm text-dimmed hover:text-slate-600 transition-colors"
                >
                  Lihat Semua
                </NuxtLink>
              </div>
            </template>

            <div
              v-if="recentFeedPosts.length === 0"
              class="w-full h-full flex items-center justify-center text-dimmed"
            >
              Belum ada artikel.
            </div>

            <div v-else class="space-y-4">
              <DashboardFeedPostCard
                v-for="post in recentFeedPosts"
                :key="post.id"
                :to="
                  post.categoryType === 'berita'
                    ? `/berita/${post.slug}`
                    : `/pena-santri/${post.slug}`
                "
                :title="post.title"
                :category="post.authorName"
                :date="post.publishedAt"
                :featured-image="post.featuredImage"
                target="_blank"
              />
            </div>
          </UCard>
        </div>
      </template>
    </template>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm text-dimmed">Dashboard Reviewer</p>
              <h1 class="text-2xl font-semibold">
                {{ greeting }}, {{ auth.user.value?.name?.split(" ")[0] }}
              </h1>
            </div>
            <UButton to="/dashboard/review" icon="i-lucide-arrow-right">
              Buka Antrian
            </UButton>
          </div>
        </template>

        <template v-if="reviewerStatus === 'pending'">
          <div class="flex items-center justify-center py-10">
            <UIcon
              name="i-lucide-loader-circle"
              class="animate-spin text-2xl text-dimmed"
            />
          </div>
        </template>

        <template v-else-if="reviewerStatus === 'error'">
          <UAlert
            color="error"
            variant="subtle"
            title="Dashboard reviewer belum bisa dimuat"
            description="Coba muat ulang data reviewer."
          >
            <template #actions>
              <UButton color="error" variant="link" @click="refreshDashboard()">
                Coba lagi
              </UButton>
            </template>
          </UAlert>
        </template>

        <template v-else-if="reviewerStats">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardStatCard
              label="Total Artikel"
              :value="reviewerStats.totalPosts"
              icon="ph:note-pencil"
              color="blue"
            />
            <DashboardStatCard
              label="Terbit"
              :value="reviewerStats.publishedPosts"
              icon="ph:check-circle"
              color="green"
            />
            <DashboardStatCard
              label="Dalam Ulasan"
              :value="reviewerStats.pendingPosts"
              icon="ph:clock"
              color="amber"
            />
            <DashboardStatCard
              label="Ditolak"
              :value="reviewerStats.rejectedPosts"
              icon="ph:x-circle"
              color="red"
            />
            <DashboardStatCard
              label="Draft"
              :value="reviewerStats.draftPosts"
              icon="ph:file-dashed"
              color="slate"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UContainer>
</template>
