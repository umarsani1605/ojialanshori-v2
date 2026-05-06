<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'superadmin',
})

await navigateTo('/admin/pages', { replace: true })
</script>

<template>
  <div />
</template>
