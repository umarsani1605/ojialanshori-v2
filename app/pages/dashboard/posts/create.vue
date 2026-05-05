<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'santri',
})
</script>

<template>
  <DashboardSantriPostEditor />
</template>
