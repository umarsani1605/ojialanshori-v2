<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
})
</script>

<template>
  <DashboardClusterPlaceholderPage
    cluster="admin"
    title="Halaman Statis"
    description="Route ini disiapkan khusus admin untuk mengelola halaman statis."
  />
</template>
