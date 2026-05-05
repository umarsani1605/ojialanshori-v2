<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth', 'role'],
  requiredRole: 'santri',
})

const route = useRoute()
const postId = computed(() => Number(route.params.id))
</script>

<template>
  <DashboardSantriPostEditor :post-id="postId" />
</template>
