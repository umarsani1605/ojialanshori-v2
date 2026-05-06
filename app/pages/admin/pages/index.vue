<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'superadmin',
})
</script>

<template>
  <DashboardClusterPlaceholderPage
    cluster="admin"
    title="Halaman Statis"
    description="Route ini disiapkan khusus superadmin untuk mengelola halaman statis."
  />
</template>
