<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Edit Artikel',
})

const route = useRoute()
const postId = Number(route.params.id)
</script>

<template>
  <PostEditor :post-id="postId" post-type="pena_santri" />
</template>
