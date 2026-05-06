<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

await navigateTo('/admin/categories', { replace: true })
</script>

<template>
  <div />
</template>
