<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Struktur Pengurus',
})
</script>

<template>
  <AdminBoardMembersPage />
</template>