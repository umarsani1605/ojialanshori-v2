<script setup lang="ts">
import type { EditorPost } from "~/composables/post-editor/types";

definePageMeta({
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "santri",
});

const route = useRoute();
const postId = computed(() => Number(route.params.id));

const { data: initialPost } = await useAsyncData(
  () => `post-editor-${postId.value}`,
  async () => {
    const response = await $fetch<{ data: EditorPost }>(`/api/posts/${postId.value}`);
    return response.data;
  },
  {
    default: () => null,
    watch: [postId],
  },
);
</script>

<template>
  <UContainer>
    <PostEditor :post-id="postId" :initial-post="initialPost ?? undefined" />
  </UContainer>
</template>
