<script setup lang="ts">
definePageMeta({
  title: 'Tulis Artikel',
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Tulis Artikel',
})
</script>

<template>
  <PostEditor post-type="pena_santri" />
</template>
