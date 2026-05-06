<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="mb-8">
    <div class="mb-4 flex items-end justify-between gap-4">
      <h2 class="text-2xl font-bold tracking-tight md:text-3xl">
        {{ title }}
      </h2>
      <slot name="action" />
    </div>

    <div class="relative h-1 w-full overflow-hidden rounded-full bg-slate-200">
      <span class="absolute inset-y-0 left-0 w-24 rounded-full bg-primary" />
    </div>
  </div>
</template>
