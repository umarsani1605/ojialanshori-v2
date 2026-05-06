<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  requiredRole: 'superadmin',
})

await navigateTo('/admin/users', { replace: true })
</script>

<template>
  <div />
</template>
