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
    title="Pengaturan"
    description="Route pengaturan dipertahankan khusus superadmin dan sudah canonical ke cluster admin."
  />
</template>
