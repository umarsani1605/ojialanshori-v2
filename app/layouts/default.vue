<script setup lang="ts">
const { data: settings } = await useFetch<Record<string, string>>(
  "/api/public/settings",
  {
    key: "public-settings",
    default: () => ({}),
    getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
  },
);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <div class="sticky top-0 z-40">
      <PublicTopBanner />
      <PublicNavbar />
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <PublicFooter :settings="settings" />
  </div>
</template>
