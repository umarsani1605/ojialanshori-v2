<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'FAQ',
})
</script>

<template>
  <AdminFaqsPage />
</template>