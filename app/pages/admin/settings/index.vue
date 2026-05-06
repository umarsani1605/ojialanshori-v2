<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
})
</script>

<template>
  <DashboardClusterPlaceholderPage
    cluster="admin"
    title="Pengaturan"
    description="Route pengaturan dipertahankan khusus admin dan sudah canonical ke cluster admin."
  />
</template>
