<script setup lang="ts">
import type { RoleColor } from "~/constants/roleDisplay";
import { roleColorMap, roleLabelMap } from "~/constants/roleDisplay";

type AdminDashboardStats = {
  type: "global";
  totalPosts: number;
  publishedPosts: number;
  pendingReviewPosts: number;
  totalSantri: number;
  totalGallery: number;
  recentPendingPosts: Array<{
    id: number;
    title: string;
    slug: string;
    featuredImage: string | null;
    createdAt: string;
    author: {
      fullname: string;
    };
  }>;
};

const auth = useAuth();
const greeting = ref("");

const {
  data: adminStats,
  status,
  refresh,
} = useLazyFetch<AdminDashboardStats>("/api/stats", {
  key: `admin-dashboard-stats-${auth.user.value?.id}`,
});

const userRole = computed(() => auth.user.value?.role ?? "");
const roleLabel = computed(
  () => roleLabelMap[userRole.value] ?? userRole.value,
);
const roleColor = computed<RoleColor>(
  () => roleColorMap[userRole.value] ?? "primary",
);

const hour = new Date().getHours();

if (hour < 10) greeting.value = "Selamat Pagi";
else if (hour < 15) greeting.value = "Selamat Siang";
else if (hour < 18) greeting.value = "Selamat Sore";
else greeting.value = "Selamat Malam";

const statItems = computed(() => [
  {
    label: "Total Artikel",
    value: adminStats.value?.totalPosts ?? 0,
    icon: "ph:article-duotone",
    color: "blue" as const,
  },
  {
    label: "Artikel Terbit",
    value: adminStats.value?.publishedPosts ?? 0,
    icon: "ph:check-circle-duotone",
    color: "green" as const,
  },
  {
    label: "Artikel dalam Review",
    value: adminStats.value?.pendingReviewPosts ?? 0,
    icon: "ph:clock-duotone",
    color: "amber" as const,
  },
  {
    label: "Total Santri",
    value: adminStats.value?.totalSantri ?? 0,
    icon: "ph:users-duotone",
    color: "purple" as const,
  },
]);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        {{ greeting }}, {{ auth.user.value?.fullname?.split(" ")[0] }}!
      </h2>
      <p class="mt-1 text-sm text-muted">
        Selamat datang di area admin Omah Ngaji Al-Anshori.
      </p>
    </div>

    <template v-if="status === 'error'">
      <div class="flex flex-col items-center gap-3 py-12 text-center">
        <p class="text-sm text-slate-500">Gagal memuat statistik.</p>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-ph-arrows-clockwise"
          @click="refresh()"
        >
          Coba lagi
        </UButton>
      </div>
    </template>

    <template v-else-if="adminStats">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AppStatCard
          v-for="item in statItems"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :icon="item.icon"
          :color="item.color"
        />
      </div>

      <UCard :ui="{ body: 'min-h-[350px] flex flex-col' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-semibold">Artikel Menunggu Review</h3>
          </div>
        </template>

        <div
          v-if="adminStats.recentPendingPosts.length === 0"
          class="flex flex-1 flex-col gap-2 items-center justify-center py-12 text-center"
        >
          <UIcon
            name="ph:folder-open-duotone"
            class="text-4xl text-slate-300"
          />
          <p class="mt-4 text-sm text-slate-400">
            Tidak ada artikel yang menunggu review.
          </p>
        </div>
        <ul v-else class="divide-y divide-default">
          <li
            v-for="post in adminStats.recentPendingPosts"
            :key="post.id"
            class="group py-3"
          >
            <NuxtLink
              :to="`/admin/pena-santri/${post.id}/edit`"
              class="flex gap-4"
            >
              <div
                class="size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100"
              >
                <img
                  v-if="post.featuredImage"
                  :src="post.featuredImage"
                  :alt="post.title"
                  class="size-full object-cover group-hover:scale-103 transition-transform"
                />
                <div
                  v-else
                  class="flex size-full items-center justify-center text-slate-300"
                >
                  <UIcon name="i-ph-image" class="text-xl" />
                </div>
              </div>
              <div class="min-w-0 mt-2">
                <p class="truncate font-medium group-hover:opacity-80">
                  {{ post.title }}
                </p>
                <p class="mt-0.5 text-sm">oleh {{ post.author.fullname }}</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </UCard>
    </template>
  </div>
</template>
