<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Kegiatan',
})
</script>

<template>
  <AdminActivitiesPage />
</template>