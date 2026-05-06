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
    title="Galeri"
    description="Pengelolaan galeri dipasang dulu di cluster admin agar navigasi dan akses role sudah final sebelum isi halamannya dibangun."
  />
</template>
