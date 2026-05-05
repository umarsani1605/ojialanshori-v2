<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: string;
  }>(),
  {
    title: 'Belum ada data',
    icon: 'i-lucide-inbox',
  },
);
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6">
    <div class="size-16 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
      <UIcon :name="icon" class="size-8" />
    </div>
    <h3 class="mt-5 font-display text-lg font-semibold">
      {{ title }}
    </h3>
  </div>
</template>
