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
    title="Banner"
    description="Route banner admin sudah dipisah dan siap diisi implementasi berikutnya tanpa bentrok dengan dashboard role lain."
  />
</template>
