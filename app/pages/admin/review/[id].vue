<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

type ReviewPost = {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  status: 'pending_review'
  updatedAt: string
  tags: string[]
  author: { id: number; name: string; email: string }
  category: { id: number; name: string; type: 'berita' | 'pena_santri' } | null
}

const route = useRoute()
const postId = Number(route.params.id)
const toast = useToast()
const router = useRouter()

const { data, status: fetchStatus } = await useFetch<{ data: ReviewPost }>(
  `/api/dashboard/review/${postId}`,
  { key: `admin-review-detail-${postId}` },
)

const post = computed(() => data.value?.data ?? null)

const reviewNote = ref('')
const submitting = ref<'approve' | 'reject' | null>(null)

async function approve() {
  submitting.value = 'approve'
  try {
    await $fetch(`/api/dashboard/review/${postId}/approve`, { method: 'POST' })
    toast.add({
      title: 'Artikel dipublish',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await router.push('/admin/review')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan saat publish.'
    toast.add({ title: 'Gagal publish', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    submitting.value = null
  }
}

async function reject() {
  if (!reviewNote.value.trim()) {
    toast.add({ title: 'Catatan review wajib diisi', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  submitting.value = 'reject'
  try {
    await $fetch(`/api/dashboard/review/${postId}/reject`, {
      method: 'POST',
      body: { reviewNote: reviewNote.value },
    })
    toast.add({ title: 'Artikel ditolak', color: 'warning', icon: 'i-lucide-x-circle' })
    await router.push('/admin/review')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan saat menolak.'
    toast.add({ title: 'Gagal tolak', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    submitting.value = null
  }
}
</script>

<template>
  <div v-if="fetchStatus === 'pending'" class="p-6 space-y-4">
    <USkeleton class="h-8 w-64" />
    <USkeleton class="h-96 w-full" />
  </div>

  <div v-else-if="!post" class="p-6">
    <UAlert
      color="error"
      icon="i-lucide-alert-circle"
      title="Post tidak ditemukan"
      description="Post tidak ditemukan atau bukan dalam status pending review."
    />
  </div>

  <div v-else class="p-6 flex gap-6 items-start">
    <div class="flex-1 min-w-0 space-y-6">
      <div>
        <UButton
          to="/admin/review"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Kembali ke Antrian"
          class="-ml-2 mb-4"
        />
        <h1 class="text-2xl font-bold">{{ post.title }}</h1>
        <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
          <span>{{ post.author.name }}</span>
          <span v-if="post.category">· {{ post.category.name }}</span>
          <span>·
            {{
              new Date(post.updatedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            }}
          </span>
        </div>
        <div v-if="post.tags.length" class="flex flex-wrap gap-1.5 mt-3">
          <UBadge
            v-for="tag in post.tags"
            :key="tag"
            :label="tag"
            variant="subtle"
            color="neutral"
          />
        </div>
      </div>

      <img
        v-if="post.featuredImage"
        :src="post.featuredImage"
        :alt="post.title"
        class="w-full rounded-lg object-cover max-h-80"
      />

      <div class="prose prose-sm max-w-none" v-html="post.content" />
    </div>

    <div class="w-80 shrink-0 space-y-4 sticky top-6">
      <UCard>
        <template #header>
          <p class="font-medium text-sm">Info Artikel</p>
        </template>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-muted shrink-0">Penulis</dt>
            <dd class="text-right">{{ post.author.name }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted shrink-0">Email</dt>
            <dd class="text-right truncate">{{ post.author.email }}</dd>
          </div>
          <div v-if="post.category" class="flex justify-between gap-2">
            <dt class="text-muted shrink-0">Kategori</dt>
            <dd class="text-right">{{ post.category.name }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-muted shrink-0">Dikirim</dt>
            <dd class="text-right">
              {{
                new Date(post.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              }}
            </dd>
          </div>
        </dl>
      </UCard>

      <UCard>
        <template #header>
          <p class="font-medium text-sm">Catatan Review</p>
        </template>
        <div class="space-y-2">
          <p class="text-sm text-muted">Wajib diisi saat menolak artikel.</p>
          <DashboardReviewNoteEditor
            v-model="reviewNote"
            :disabled="!!submitting"
          />
        </div>
      </UCard>

      <div class="flex flex-col gap-2">
        <UButton
          label="Publish Artikel"
          color="success"
          icon="i-lucide-check"
          block
          :loading="submitting === 'approve'"
          :disabled="!!submitting"
          @click="approve"
        />
        <UButton
          label="Tolak Artikel"
          color="error"
          variant="outline"
          icon="i-lucide-x"
          block
          :loading="submitting === 'reject'"
          :disabled="!!submitting"
          @click="reject"
        />
      </div>
    </div>
  </div>
</template>
