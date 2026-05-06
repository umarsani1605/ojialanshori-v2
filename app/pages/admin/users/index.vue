<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'superadmin',
})
</script>

<template>
  <AdminUsersManagementPage />
</template>
