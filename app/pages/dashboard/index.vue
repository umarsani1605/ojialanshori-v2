<script setup lang="ts">
import type { RoleColor } from '~/utils/roleDisplay'

definePageMeta({
  middleware: ['auth'],
})

type AdminDashboardStats = {
  type: 'global'
  publishedPosts: number
  pendingReviewPosts: number
  totalUsers: number
  totalGallery: number
  recentPendingPosts: Array<{
    id: number
    title: string
    slug: string
    createdAt: string
    author: {
      name: string
    }
  }>
}

type ReviewerDashboardStats = {
  type: 'personal'
  totalPosts: number
  publishedPosts: number
  pendingPosts: number
  rejectedPosts: number
  draftPosts: number
  recentPosts: Array<{
    id: number
    title: string
    slug: string
    status: 'draft' | 'pending_review' | 'published' | 'rejected'
    rejectionNote: string | null
    createdAt: string
  }>
}

type SantriDashboardStats = {
  total: number
  published: number
  pendingReview: number
  rejected: number
  latestApprovedPost: {
    id: number
    title: string
    slug: string
    publishedAt: string | Date | null
    categoryType: 'berita' | 'pena_santri'
  } | null
}

type SantriMyPost = {
  id: number
  title: string
  slug: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  publishedAt: string | Date | null
  createdAt: string | Date
  categoryName: string | null
}

type SantriFeedPost = {
  id: number
  title: string
  slug: string
  publishedAt: string | Date | null
  createdAt: string | Date
  categoryName: string
  categoryType: 'berita' | 'pena_santri'
  authorName: string
}

const auth = useAuth()
const isSantri = computed(() => auth.isSantri.value)

setPageLayout(isSantri.value ? 'dashboard-santri' : 'admin')

const greeting = ref('')
const approvedAlertDismissed = ref(false)

const { data: adminStats, status: adminStatus, refresh: refreshAdminStats } = await useFetch<AdminDashboardStats | ReviewerDashboardStats>('/api/dashboard/stats', {
  key: `dashboard-stats-${auth.user.value?.id}`,
  immediate: !isSantri.value,
})

const { data: santriStats, status: santriStatsStatus, refresh: refreshSantriStats } = await useFetch<SantriDashboardStats>('/api/dashboard/santri/stats', {
  key: `dashboard-santri-stats-${auth.user.value?.id}`,
  immediate: isSantri.value,
})

const { data: santriMyPosts, status: santriMyPostsStatus, refresh: refreshSantriMyPosts } = await useFetch<{ data: SantriMyPost[] }>('/api/dashboard/santri/my-posts', {
  key: `dashboard-santri-my-posts-${auth.user.value?.id}`,
  immediate: isSantri.value,
})

const { data: santriFeed, status: santriFeedStatus, refresh: refreshSantriFeed } = await useFetch<{ data: SantriFeedPost[] }>('/api/dashboard/santri/feed', {
  key: `dashboard-santri-feed-${auth.user.value?.id}`,
  immediate: isSantri.value,
})

const userRole = computed(() => auth.user.value?.role ?? '')
const roleLabel = computed(() => roleLabelMap[userRole.value] ?? userRole.value)
const roleColor = computed<RoleColor>(() => roleColorMap[userRole.value] ?? 'primary')

const postStatusLabel: Record<SantriMyPost['status'], string> = {
  published: 'Terpublikasi',
  pending_review: 'Menunggu Review',
  rejected: 'Ditolak',
  draft: 'Draft',
}

const postStatusColor: Record<SantriMyPost['status'], 'success' | 'warning' | 'error' | 'neutral'> = {
  published: 'success',
  pending_review: 'warning',
  rejected: 'error',
  draft: 'neutral',
}

const latestApprovedPost = computed(() => santriStats.value?.latestApprovedPost ?? null)
const latestApprovedListingPath = computed(() => {
  if (!latestApprovedPost.value) {
    return '/pena-santri'
  }

  return latestApprovedPost.value.categoryType === 'berita' ? '/berita' : '/pena-santri'
})

const santriLoading = computed(() =>
  santriStatsStatus.value === 'pending'
  || santriMyPostsStatus.value === 'pending'
  || santriFeedStatus.value === 'pending',
)

const santriError = computed(() =>
  santriStatsStatus.value === 'error'
  || santriMyPostsStatus.value === 'error'
  || santriFeedStatus.value === 'error',
)

const showApprovedAlert = computed(() => Boolean(latestApprovedPost.value) && !approvedAlertDismissed.value)

onMounted(() => {
  const hour = new Date().getHours()

  if (hour < 10) greeting.value = 'Selamat Pagi'
  else if (hour < 15) greeting.value = 'Selamat Siang'
  else if (hour < 18) greeting.value = 'Selamat Sore'
  else greeting.value = 'Selamat Malam'
})

watch(latestApprovedPost, (post) => {
  if (!import.meta.client) {
    return
  }

  if (!post) {
    approvedAlertDismissed.value = true
    return
  }

  approvedAlertDismissed.value = window.localStorage.getItem(getApprovedAlertStorageKey(post)) === '1'
}, { immediate: true })

async function refreshDashboard() {
  if (isSantri.value) {
    await Promise.all([
      refreshSantriStats(),
      refreshSantriMyPosts(),
      refreshSantriFeed(),
    ])
    return
  }

  await refreshAdminStats()
}

async function openApprovedPost() {
  if (latestApprovedPost.value && import.meta.client) {
    window.localStorage.setItem(getApprovedAlertStorageKey(latestApprovedPost.value), '1')
    approvedAlertDismissed.value = true
  }

  await navigateTo(latestApprovedListingPath.value)
}

function getApprovedAlertStorageKey(post: NonNullable<SantriDashboardStats['latestApprovedPost']>) {
  return `dashboard-approved-alert:${post.id}:${String(post.publishedAt)}`
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) {
    return 'Tanggal belum tersedia'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}
</script>

<template>
  <div v-if="isSantri">
    <UContainer class="max-w-5xl px-6 py-8">
      <div class="space-y-6">
        <div>
          <h1 class="text-xl font-semibold">
            {{ greeting }}, {{ auth.user.value?.name?.split(' ')[0] }}! 👋
          </h1>
          <p class="mt-1 text-sm text-muted">
            Selamat datang di dashboard Omah Ngaji Al-Anshori.
          </p>
        </div>

        <template v-if="santriLoading">
          <div class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="text-2xl text-neutral-400 animate-spin" />
          </div>
        </template>

        <template v-else-if="santriError">
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-muted">
              Gagal memuat dashboard santri.
            </p>
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              @click="refreshDashboard()"
            >
              Coba lagi
            </UButton>
          </div>
        </template>

        <template v-else>
          <UAlert
            v-if="(santriStats?.rejected ?? 0) > 0"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            :title="`${santriStats?.rejected} post kamu ditolak`"
            description="Periksa catatan penolakan dari reviewer."
          >
            <template #actions>
              <UButton
                to="/dashboard/posts?status=rejected"
                variant="link"
                color="error"
              >
                Lihat →
              </UButton>
            </template>
          </UAlert>

          <UAlert
            v-if="showApprovedAlert"
            color="success"
            variant="subtle"
            icon="i-lucide-check-circle"
            :title="`Post kamu baru saja disetujui! '${latestApprovedPost?.title}'`"
            description="Post terpublikasi dalam 7 hari terakhir."
          >
            <template #actions>
              <UButton
                variant="link"
                color="success"
                @click="openApprovedPost()"
              >
                Lihat →
              </UButton>
            </template>
          </UAlert>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p class="text-sm text-muted">Total Post</p>
              <p class="mt-1 text-2xl font-bold">{{ santriStats?.total ?? 0 }}</p>
            </div>
            <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p class="text-sm text-muted">Terpublikasi</p>
              <p class="mt-1 text-2xl font-bold">{{ santriStats?.published ?? 0 }}</p>
            </div>
            <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p class="text-sm text-muted">Menunggu Review</p>
              <p class="mt-1 text-2xl font-bold">{{ santriStats?.pendingReview ?? 0 }}</p>
            </div>
            <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p class="text-sm text-muted">Ditolak</p>
              <p class="mt-1 text-2xl font-bold">{{ santriStats?.rejected ?? 0 }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <h2 class="text-sm font-semibold">Post Saya Terbaru</h2>
                  <UButton to="/dashboard/posts" variant="link" color="primary">
                    Semua →
                  </UButton>
                </div>
              </template>

              <div v-if="(santriMyPosts?.data.length ?? 0) === 0" class="py-6 text-center text-sm text-muted">
                Belum ada post yang ditulis.
              </div>

              <div v-else class="divide-y divide-default">
                <div
                  v-for="post in santriMyPosts?.data"
                  :key="post.id"
                  class="flex items-start justify-between gap-4 py-3"
                >
                  <div class="min-w-0">
                    <p class="line-clamp-2 text-sm font-medium">
                      {{ post.title }}
                    </p>
                    <p class="mt-1 text-xs text-dimmed">
                      {{ post.categoryName ?? 'Belum pilih kategori' }} · {{ formatDate(post.publishedAt ?? post.createdAt) }}
                    </p>
                  </div>
                  <UBadge
                    :color="postStatusColor[post.status]"
                    variant="subtle"
                    size="xs"
                    class="shrink-0"
                  >
                    {{ postStatusLabel[post.status] }}
                  </UBadge>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <h2 class="text-sm font-semibold">Post Terbaru</h2>
                  <span class="text-xs text-dimmed">Semua santri</span>
                </div>
              </template>

              <div v-if="(santriFeed?.data.length ?? 0) === 0" class="py-6 text-center text-sm text-muted">
                Belum ada post published dari santri.
              </div>

              <div v-else class="divide-y divide-default">
                <div
                  v-for="post in santriFeed?.data"
                  :key="post.id"
                  class="py-3"
                >
                  <p class="line-clamp-2 text-sm font-medium">
                    {{ post.title }}
                  </p>
                  <p class="mt-1 text-xs text-dimmed">
                    oleh {{ post.authorName }} · {{ post.categoryName }} · {{ formatDate(post.publishedAt ?? post.createdAt) }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </template>
      </div>
    </UContainer>
  </div>

  <AppContent v-else title="Beranda" :loading="adminStatus === 'pending'">
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold text-neutral-800">
          {{ greeting }}, {{ auth.user.value?.name?.split(' ')[0] }}!
        </h2>
        <p class="mt-1 text-sm text-neutral-500">
          Selamat datang di dashboard Omah Ngaji Al-Anshori.
        </p>
      </div>

      <template v-if="adminStatus === 'pending'">
        <div class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-circle" class="text-2xl text-neutral-400 animate-spin" />
        </div>
      </template>

      <template v-else-if="adminStatus === 'error'">
        <div class="flex flex-col items-center gap-3 py-12 text-center">
          <p class="text-sm text-neutral-500">
            Gagal memuat statistik.
          </p>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="refreshDashboard()"
          >
            Coba lagi
          </UButton>
        </div>
      </template>

      <template v-else-if="adminStats">
        <template v-if="adminStats.type === 'global'">
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-green-50 p-2">
                  <UIcon name="i-lucide-file-check" class="text-xl text-green-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.publishedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Post Terpublikasi
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-amber-50 p-2">
                  <UIcon name="i-lucide-inbox" class="text-xl text-amber-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.pendingReviewPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Menunggu Review
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-blue-50 p-2">
                  <UIcon name="i-lucide-users" class="text-xl text-blue-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.totalUsers }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Total User
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-purple-50 p-2">
                  <UIcon name="i-lucide-image" class="text-xl text-purple-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.totalGallery }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Foto Galeri
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold text-neutral-700">
                  Post Menunggu Review
                </h3>
                <UBadge :color="roleColor" variant="subtle" size="xs">
                  {{ roleLabel }}
                </UBadge>
              </div>
            </template>

            <div
              v-if="adminStats.recentPendingPosts.length === 0"
              class="py-6 text-center text-sm text-neutral-400"
            >
              Tidak ada post yang menunggu review.
            </div>
            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="post in adminStats.recentPendingPosts"
                :key="post.id"
                class="flex items-center justify-between gap-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-neutral-800">
                    {{ post.title }}
                  </p>
                  <p class="mt-0.5 text-xs text-neutral-500">
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

        <template v-else>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-blue-50 p-2">
                  <UIcon name="i-lucide-file-text" class="text-xl text-blue-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.totalPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Total Post
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-green-50 p-2">
                  <UIcon name="i-lucide-file-check" class="text-xl text-green-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.publishedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Terpublikasi
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-amber-50 p-2">
                  <UIcon name="i-lucide-clock" class="text-xl text-amber-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.pendingPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Menunggu Review
                  </p>
                </div>
              </div>
            </UCard>
            <UCard>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-red-50 p-2">
                  <UIcon name="i-lucide-file-x" class="text-xl text-red-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral-800">
                    {{ adminStats.rejectedPosts }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Ditolak
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold text-neutral-700">
                  Post Terbaru Saya
                </h3>
                <UBadge :color="roleColor" variant="subtle" size="xs">
                  {{ roleLabel }}
                </UBadge>
              </div>
            </template>

            <div
              v-if="adminStats.recentPosts.length === 0"
              class="py-6 text-center text-sm text-neutral-400"
            >
              Belum ada post.
            </div>
            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="post in adminStats.recentPosts"
                :key="post.id"
                class="space-y-1 py-3"
              >
                <div class="flex items-center justify-between gap-4">
                  <p class="truncate text-sm font-medium text-neutral-800">
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
                  class="rounded bg-red-50 px-2 py-1 text-xs text-red-600"
                >
                  Catatan: {{ post.rejectionNote }}
                </p>
              </li>
            </ul>
          </UCard>
        </template>
      </template>
    </div>
  </AppContent>
</template>
