<script setup lang="ts">
definePageMeta({
  title: "Tulis Artikel",
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "santri",
});
</script>

<template>
  <UContainer>
    <PostEditor />
  </UContainer>
</template>
