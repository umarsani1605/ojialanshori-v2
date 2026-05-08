<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Edit Halaman',
})
const route = useRoute()
const template = route.params.template as string
</script>

<template>
  <AdminPageEditor :template="template" />
</template>