<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
})
</script>

<template>
  <AdminUsersManagementPage />
</template>
