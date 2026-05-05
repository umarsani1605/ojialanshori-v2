<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useFetch(`/api/public/posts/${slug}`, {
  key: `public-post-${slug}`,
})

if (error.value?.statusCode === 404 || !data.value?.post) {
  throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan' })
}

const post = computed(() => data.value!.post)

useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt ?? undefined,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt ?? undefined,
  ogImage: post.value.featuredImage ?? undefined,
  ogType: 'article',
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.value.title,
      datePublished: post.value.publishedAt ?? post.value.createdAt,
      author: { '@type': 'Person', name: post.value.authorName },
      image: post.value.featuredImage,
    }),
  }],
})
</script>

<template>
  <PublicPostDetail
    :post="post"
    back-path="/berita"
    back-label="Berita"
  />
</template>
