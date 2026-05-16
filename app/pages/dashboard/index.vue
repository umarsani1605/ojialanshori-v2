<script setup lang="ts">
import type {
  PublicPostListItem as SantriFeedPost,
  SantriDashboardStats,
  SantriMyPost,
} from "~~/shared/types";

definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'dashboard',
})

const auth = useAuth();
const greeting = ref("");
const approvedAlertDismissed = ref(false);

const {
  data: santriStats,
  status: santriStatsStatus,
  refresh: refreshSantriStats,
} = useLazyFetch<SantriDashboardStats>("/api/posts/stats", {
  key: `dashboard-santri-stats-${auth.user.value?.id}`,
  default: () => null,
});

const {
  data: santriMyPosts,
  status: santriMyPostsStatus,
  refresh: refreshSantriMyPosts,
} = useLazyFetch<{ data: SantriMyPost[] }>("/api/posts/my-posts", {
  key: `dashboard-santri-my-posts-${auth.user.value?.id}`,
  default: () => ({ data: [] }),
});

const {
  data: santriFeed,
  status: santriFeedStatus,
  refresh: refreshSantriFeed,
} = useLazyFetch<{ data: SantriFeedPost[] }>("/api/posts/feed", {
  key: `dashboard-santri-feed-${auth.user.value?.id}`,
  default: () => ({ data: [] }),
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
    icon: "i-ph-note-pencil-duotone",
    color: "blue" as const,
  },
  {
    label: "Terbit",
    value: santriStats.value?.published ?? 0,
    icon: "i-ph-check-circle-duotone",
    color: "green" as const,
  },
  {
    label: "Dalam Review",
    value: santriStats.value?.pendingReview ?? 0,
    icon: "i-ph-clock-duotone",
    color: "amber" as const,
  },
  {
    label: "Ditolak",
    value: santriStats.value?.rejected ?? 0,
    icon: "i-ph-x-circle-duotone",
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
  await Promise.all([
    refreshSantriStats(),
    refreshSantriMyPosts(),
    refreshSantriFeed(),
  ]);
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
    pending_review: "Dalam Review",
    published: "Terbit",
    rejected: "Rejected",
  }[status];
}
</script>

<template>
  <UContainer class="space-y-6">
    <div class="relative overflow-hidden rounded-xl bg-linear-to-r from-[#3FC0A2] to-[#73CD8F] p-8 text-white">
      <img src="/images/greetings-left.png" class="absolute top-0 left-0 h-full object-contain pointer-events-none"
        alt="" />
      <img src="/images/greetings-right.png"
        class="hidden md:block absolute top-0 right-0 h-full object-contain pointer-events-none" alt="" />

      <div class="relative z-10 space-y-2">
        <h1 class="text-2xl font-bold">
          {{ greeting }}, {{ auth.user.value?.nickname || auth.user.value?.fullname?.split(" ")[0] }}! 👋🏻
        </h1>
        <p class="text-md text-white/90">
          <template v-if="auth.isReviewer.value">
            Langkah kecil menuju karya besar. Tuliskan ide-idemu, ulas artikel
            lain, dan pantau progress artikelmu!
          </template>
          <template v-else>
            Langkah kecil menuju karya besar. Tuliskan ide-idemu dan pantau
            progress artikelmu!
          </template>
        </p>
      </div>
    </div>

    <template v-if="santriLoading">
      <UCard>
        <div class="flex items-center justify-center py-10">
          <UIcon name="i-ph-spinner-gap" class="animate-spin text-2xl text-dimmed" />
        </div>
      </UCard>
    </template>

    <template v-else-if="santriError">
      <UAlert color="error" variant="subtle" title="Dashboard belum bisa dimuat"
        description="Coba muat ulang data dashboard santri.">
        <template #actions>
          <UButton color="error" variant="link" @click="refreshDashboard()">
            Coba lagi
          </UButton>
        </template>
      </UAlert>
    </template>

    <template v-else>
      <div v-if="auth.isReviewer.value" class="flex flex-col md:flex-row items-stretch gap-6">
        <AppStatCard label="Perlu Review" :value="santriStats?.queueCount ?? 0" icon="i-ph-clock-countdown-duotone"
          color="orange" :wrap="false" class="md:w-52 md:shrink-0" />
        <div class="h-px md:h-auto md:w-px bg-slate-200 self-stretch shrink-0" />
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 flex-1">
          <AppStatCard v-for="item in statItems" :key="item.label" :label="item.label" :value="item.value"
            :icon="item.icon" :color="item.color" />
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AppStatCard v-for="item in statItems" :key="item.label" :label="item.label" :value="item.value"
          :icon="item.icon" :color="item.color" />
      </div>

      <UAlert v-if="(santriStats?.rejected ?? 0) > 0" color="warning" variant="subtle"
        :title="`${santriStats?.rejected} Artikel Perlu Diperbaiki!`"
        description="Cek halaman detail artikel untuk melihat catatan dari reviewer.">
        <template #actions>
          <UButton to="/dashboard/posts?status=rejected" size="md" color="warning" variant="outline">
            Buka daftar
          </UButton>
        </template>
      </UAlert>

      <div class="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <UCard class="flex flex-col" :ui="{ body: 'pt-4! flex-1' }">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="font-semibold">Artikel Saya</h2>
              </div>
              <NuxtLink to="/dashboard/posts" class="text-sm text-dimmed hover:text-slate-600 transition-colors">
                Lihat Semua
              </NuxtLink>
            </div>
          </template>

          <PublicEmptyState
            v-if="recentMyPosts.length === 0"
            title="Belum ada artikel yang ditulis."
          />

          <div v-else class="space-y-4">
            <DashboardFeedPostCard v-for="post in recentMyPosts" :key="post.id" :to="`/dashboard/posts/${post.id}/edit`"
              :title="post.title" :category="post.categoryName ?? 'Belum pilih kategori'"
              :date="post.publishedAt ?? post.createdAt"
              :featured-image="post.featuredImage">
              <template #trailing>
                <UBadge :color="getPostStatusTone(post.status)" variant="subtle">
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
              <NuxtLink to="/pena-santri" class="text-sm text-dimmed hover:text-slate-600 transition-colors">
                Lihat Semua
              </NuxtLink>
            </div>
          </template>

          <PublicEmptyState
            v-if="recentFeedPosts.length === 0"
            title="Belum ada artikel."
          />

          <div v-else class="space-y-4">
            <DashboardFeedPostCard v-for="post in recentFeedPosts" :key="post.id" :to="post.categoryType === 'berita'
              ? `/berita/${post.slug}`
              : `/pena-santri/${post.slug}`
              " :title="post.title" :category="post.authorName" :date="post.publishedAt"
              :featured-image="post.featuredImage" target="_blank" />
          </div>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
