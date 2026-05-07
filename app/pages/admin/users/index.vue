<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  navbarTitle: 'Users',
})
</script>

<template>
  <AdminUsersManagementPage />
</template>
