<script setup lang="ts">
import type { RoleColor } from '~/utils/roleDisplay'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()

const { data: stats, status, refresh } = await useFetch('/api/dashboard/stats', {
  key: `dashboard-stats-${auth.user.value?.id}`,
})

const greeting = ref('')
onMounted(() => {
  const hour = new Date().getHours()
  if (hour < 11) greeting.value = 'Selamat Pagi'
  else if (hour < 15) greeting.value = 'Selamat Siang'
  else if (hour < 18) greeting.value = 'Selamat Sore'
  else greeting.value = 'Selamat Malam'
})

const userRole = computed(() => auth.user.value?.role ?? '')
const roleLabel = computed(() => roleLabelMap[userRole.value] ?? userRole.value)
const roleColor = computed<RoleColor>(() => roleColorMap[userRole.value] ?? 'primary')

const postStatusLabel: Record<string, string> = {
  published: 'Terpublikasi',
  pending_review: 'Menunggu Review',
  rejected: 'Ditolak',
  draft: 'Draft',
}

const postStatusColor: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  published: 'success',
  pending_review: 'warning',
  rejected: 'error',
  draft: 'neutral',
}
</script>

<template>
  <AppContent title="Beranda" :loading="status === 'pending'">
    <div class="space-y-6">
        <!-- Greeting -->
        <div>
          <h2 class="text-xl font-semibold text-neutral-800">
            {{ greeting }}, {{ auth.user.value?.name?.split(' ')[0] }}!
          </h2>
          <p class="text-sm text-neutral-500 mt-1">
            Selamat datang di dashboard Omah Ngaji Al-Anshori.
          </p>
        </div>

        <template v-if="status === 'pending'">
          <div class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-neutral-400 text-2xl" />
          </div>
        </template>

        <template v-else-if="status === 'error'">
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-neutral-500">
              Gagal memuat statistik.
            </p>
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

        <!-- Admin view: global stats -->
        <template v-else-if="stats && stats.type === 'global'">
          <!-- Stats cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-50 rounded-lg">
                  <UIcon name="i-lucide-file-check" class="text-green-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.publishedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Post Terpublikasi
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-amber-50 rounded-lg">
                  <UIcon name="i-lucide-inbox" class="text-amber-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.pendingReviewPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Menunggu Review
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <UIcon name="i-lucide-users" class="text-blue-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.totalUsers }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Total User
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-50 rounded-lg">
                  <UIcon name="i-lucide-image" class="text-purple-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.totalGallery }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Foto Galeri
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Recent pending posts -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-neutral-700">
                Post Menunggu Review
              </h3>
            </template>
            <div
              v-if="stats.recentPendingPosts.length === 0"
              class="py-6 text-center text-sm text-neutral-400"
            >
              Tidak ada post yang menunggu review.
            </div>
            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="post in stats.recentPendingPosts"
                :key="post.id"
                class="flex items-center justify-between py-3 gap-4"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium text-neutral-800 truncate">
                    {{ post.title }}
                  </p>
                  <p class="text-xs text-neutral-500 mt-0.5">
                    oleh {{ post.author.name }}
                  </p>
                </div>
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="xs"
                  class="shrink-0"
                >
                  Menunggu Review
                </UBadge>
              </li>
            </ul>
          </UCard>
        </template>

        <!-- Personal view: santri & reviewer -->
        <template v-else-if="stats && stats.type === 'personal'">
          <!-- Rejected alert -->
          <UAlert
            v-if="stats.rejectedPosts > 0"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="`${stats.rejectedPosts} post kamu ditolak`"
            description="Periksa post kamu untuk melihat catatan penolakan."
          />

          <!-- Stats cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <UIcon name="i-lucide-file-text" class="text-blue-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.totalPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Total Post
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-green-50 rounded-lg">
                  <UIcon name="i-lucide-file-check" class="text-green-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.publishedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Terpublikasi
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-amber-50 rounded-lg">
                  <UIcon name="i-lucide-clock" class="text-amber-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.pendingPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Menunggu Review
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-red-50 rounded-lg">
                  <UIcon name="i-lucide-file-x" class="text-red-600 text-xl" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ stats.rejectedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Ditolak
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Recent posts -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-neutral-700">
                Post Terbaru Saya
              </h3>
            </template>
            <div
              v-if="stats.recentPosts.length === 0"
              class="py-6 text-center text-sm text-neutral-400"
            >
              Belum ada post. Mulai tulis post pertamamu!
            </div>
            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="post in stats.recentPosts"
                :key="post.id"
                class="py-3 space-y-1"
              >
                <div class="flex items-center justify-between gap-4">
                  <p class="text-sm font-medium text-neutral-800 truncate">
                    {{ post.title }}
                  </p>
                  <UBadge
                    :color="postStatusColor[post.status] ?? 'neutral'"
                    variant="subtle"
                    size="xs"
                    class="shrink-0"
                  >
                    {{ postStatusLabel[post.status] ?? post.status }}
                  </UBadge>
                </div>
                <p
                  v-if="post.status === 'rejected' && post.rejectionNote"
                  class="text-xs text-red-600 bg-red-50 rounded px-2 py-1"
                >
                  Catatan: {{ post.rejectionNote }}
                </p>
              </li>
            </ul>
          </UCard>
        </template>
      </div>
  </AppContent>
</template>
