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
    title="Kategori"
    description="Manajemen kategori sekarang punya route admin canonical terpisah dari dashboard santri."
  />
</template>
