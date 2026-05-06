<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'reviewer',
})
</script>

<template>
  <DashboardClusterPlaceholderPage
    cluster="dashboard"
    title="Antrian Review"
    description="Route reviewer sudah dipisah ke cluster dashboard. Halaman queue final bisa dibangun di atas route ini tanpa lagi berbagi canonical URL dengan admin."
  />
</template>
