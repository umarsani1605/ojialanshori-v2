<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Tulis Artikel',
})
</script>

<template>
  <PostEditor post-type="pena_santri" />
</template>
