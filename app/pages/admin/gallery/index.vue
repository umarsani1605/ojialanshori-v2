<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Galeri',
})
</script>

<template>
  <AdminGalleryPage />
</template>
