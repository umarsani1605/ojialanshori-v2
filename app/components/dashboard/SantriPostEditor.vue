<script setup lang="ts">
defineProps<{
  postId?: number;
}>();
</script>

<template>
  <PostEditor :post-id="postId" />
</template>
