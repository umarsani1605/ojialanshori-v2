<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

await navigateTo('/admin/posts', { replace: true })
</script>

<template>
  <div />
</template>
