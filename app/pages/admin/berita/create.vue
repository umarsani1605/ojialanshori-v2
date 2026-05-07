<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Tulis Berita',
})
</script>

<template>
  <PostEditor post-type="berita" />
</template>
