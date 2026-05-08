<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Testimonial',
})
</script>

<template>
  <AdminTestimonialsPage />
</template>