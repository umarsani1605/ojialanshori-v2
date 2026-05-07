<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Kategori',
})
</script>

<template>
  <AdminCategoriesPage />
</template>
