<script setup lang="ts">
const { data: settings } = await useFetch<Record<string, string>>('/api/public/settings', {
  key: 'public-settings',
  default: () => ({}),
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <PublicTopBanner />
    <PublicNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <PublicFooter :settings="settings" />
  </div>
</template>
