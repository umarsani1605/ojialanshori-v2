<script setup lang="ts">
type Post = {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featuredImage: string | null
  publishedAt: string | Date | null
  createdAt: string | Date
  categorySlug?: string
  authorName?: string
}

const props = defineProps<{
  post: Post
  basePath?: string
}>()

const href = computed(() => `${props.basePath ?? '/berita'}/${props.post.slug}`)

const dateFormatted = computed(() => {
  const date = props.post.publishedAt ?? props.post.createdAt
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

const cleanExcerpt = computed(() => {
  if (!props.post.excerpt) return ''
  return props.post.excerpt.replace(/<[^>]*>/g, '').slice(0, 140)
})
</script>

<template>
  <NuxtLink
    :to="href"
    class="group block bg-white rounded-xl overflow-hidden border border-default hover:shadow-lg transition-shadow"
  >
    <div class="aspect-[16/10] bg-neutral-100 overflow-hidden">
      <NuxtImg
        v-if="post.featuredImage"
        :src="post.featuredImage"
        :alt="post.title"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-neutral-400"
      >
        <UIcon name="i-lucide-image" class="size-10" />
      </div>
    </div>
    <div class="p-4 space-y-2">
      <h3 class="font-semibold text-neutral-800 line-clamp-2 group-hover:text-emerald-700 transition-colors">
        {{ post.title }}
      </h3>
      <p
        v-if="cleanExcerpt"
        class="text-sm text-neutral-500 line-clamp-2"
      >
        {{ cleanExcerpt }}
      </p>
      <div class="flex items-center justify-between text-xs text-neutral-400 pt-1">
        <span>{{ dateFormatted }}</span>
        <span v-if="post.authorName" class="truncate max-w-[40%]">
          {{ post.authorName }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
