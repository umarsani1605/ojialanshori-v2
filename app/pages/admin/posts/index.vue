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
    title="Semua Artikel"
    description="Listing editorial lintas penulis akan hidup di route admin ini. Namespace API lama tetap bisa dipakai pada fase refactor ini."
  />
</template>
