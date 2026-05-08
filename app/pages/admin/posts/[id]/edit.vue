<script setup lang="ts">
import type { EditorPost } from "~/composables/post-editor/types";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  requiredRole: "admin",
  navbarTitle: "Edit Artikel",
});

const route = useRoute();
const postId = Number(route.params.id);

const { data: initialPost } = await useAsyncData(
  () => `post-editor-${postId}`,
  async () => {
    const response = await $fetch<{ data: EditorPost }>(`/api/posts/${postId}`);
    return response.data;
  },
  {
    default: () => null,
  },
);
</script>

<template>
  <PostEditor :post-id="postId" :initial-post="initialPost ?? undefined" />
</template>
