<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'dashboard',
})
</script>

<template>
  <DashboardHomePage />
</template>
