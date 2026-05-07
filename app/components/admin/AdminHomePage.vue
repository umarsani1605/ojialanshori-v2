<script setup lang="ts">
import type { RoleColor } from "~/constants/roleDisplay";
import { roleColorMap, roleLabelMap } from "~/constants/roleDisplay";

type AdminDashboardStats = {
  type: "global";
  publishedPosts: number;
  pendingReviewPosts: number;
  totalUsers: number;
  totalGallery: number;
  recentPendingPosts: Array<{
    id: number;
    title: string;
    slug: string;
    createdAt: string;
    author: {
      name: string;
    };
  }>;
};

const auth = useAuth();
const greeting = ref("");

const {
  data: adminStats,
  status,
  refresh,
} = useLazyFetch<AdminDashboardStats>("/api/dashboard/stats", {
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">
        {{ greeting }}, {{ auth.user.value?.name?.split(" ")[0] }}!
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
            icon="i-lucide-refresh-cw"
            @click="refresh()"
          >
            Coba lagi
          </UButton>
        </div>
      </template>

      <template v-else-if="adminStats">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <UCard>
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-green-50 p-2">
                <UIcon
                  name="i-lucide-file-check"
                  class="text-xl text-green-600"
                />
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-800">
                  {{ adminStats.publishedPosts }}
                </p>
                <p class="text-xs text-slate-500">Artikel Terbit</p>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-amber-50 p-2">
                <UIcon name="i-lucide-inbox" class="text-xl text-amber-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-800">
                  {{ adminStats.pendingReviewPosts }}
                </p>
                <p class="text-xs text-slate-500">Dalam Ulasan</p>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-blue-50 p-2">
                <UIcon name="i-lucide-users" class="text-xl text-blue-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-800">
                  {{ adminStats.totalUsers }}
                </p>
                <p class="text-xs text-slate-500">Total User</p>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-purple-50 p-2">
                <UIcon name="i-lucide-image" class="text-xl text-purple-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-800">
                  {{ adminStats.totalGallery }}
                </p>
                <p class="text-xs text-slate-500">Foto Galeri</p>
              </div>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-slate-700">
                Artikel Dalam Ulasan
              </h3>
              <UBadge :color="roleColor" variant="subtle" size="xs">
                {{ roleLabel }}
              </UBadge>
            </div>
          </template>

          <div
            v-if="adminStats.recentPendingPosts.length === 0"
            class="py-6 text-center text-sm text-slate-400"
          >
            Tidak ada artikel yang menunggu review.
          </div>
          <ul v-else class="divide-y divide-default">
            <li
              v-for="post in adminStats.recentPendingPosts"
              :key="post.id"
              class="flex items-center justify-between gap-4 py-3"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-800">
                  {{ post.title }}
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  oleh {{ post.author.name }}
                </p>
              </div>
              <UBadge
                color="warning"
                variant="subtle"
                size="xs"
                class="shrink-0"
              >
                Dalam Ulasan
              </UBadge>
            </li>
          </ul>
        </UCard>
      </template>
  </div>
</template>
