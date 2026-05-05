<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="mb-12">
    <div class="flex items-end justify-between gap-4 mb-5">
      <h2 class="font-bold text-2xl md:text-3xl tracking-wide">
        {{ title }}
      </h2>
      <slot name="action" />
    </div>
    <div class="relative h-1 bg-default rounded-full">
      <span class="absolute left-0 top-0 h-1 w-24 bg-primary rounded-full" />
    </div>
  </div>
</template>
