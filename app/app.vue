<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} · Omah Ngaji Al-Anshori` : 'Omah Ngaji Al-Anshori',
})

useSeoMeta({
  ogSiteName: 'Omah Ngaji Al-Anshori',
  twitterCard: 'summary_large_image',
  ogImage: '/images/logo/logo.png',
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
