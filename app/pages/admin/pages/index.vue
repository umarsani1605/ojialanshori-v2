<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Halaman Publik',
})
</script>

<template>
  <AdminPagesIndex />
</template>