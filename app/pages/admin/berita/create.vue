<script setup lang="ts">
definePageMeta({
  title: 'Tulis Berita',
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Tulis Berita',
})
</script>

<template>
  <PostEditor post-type="berita" />
</template>
