<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Beranda',
})
</script>

<template>
  <AdminHomePage />
</template>
