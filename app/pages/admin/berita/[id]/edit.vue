<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Edit Berita',
})

const route = useRoute()
const postId = Number(route.params.id)
</script>

<template>
  <PostEditor :post-id="postId" post-type="berita" />
</template>
