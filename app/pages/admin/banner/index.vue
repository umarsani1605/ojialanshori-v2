<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Banner',
})
</script>

<template>
  <AdminBannersPage />
</template>
