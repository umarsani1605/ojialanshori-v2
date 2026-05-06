<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

await navigateTo('/admin/banner', { replace: true })
</script>

<template>
  <div />
</template>
