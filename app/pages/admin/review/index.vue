<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})
</script>

<template>
  <DashboardClusterPlaceholderPage
    cluster="admin"
    title="Review Artikel"
    description="Area review untuk superadmin dan pengurus sudah dipindah ke cluster admin dengan canonical URL baru."
  />
</template>
