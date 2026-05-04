<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
}>(), {
  title: 'Belum ada data',
  description: 'Konten akan muncul di sini ketika sudah tersedia.',
  icon: 'i-lucide-inbox',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6">
    <div class="p-4 rounded-full bg-emerald-50 text-emerald-600">
      <UIcon :name="icon" class="size-8" />
    </div>
    <h3 class="mt-4 text-base font-semibold text-neutral-700">
      {{ title }}
    </h3>
    <p class="mt-1 text-sm text-neutral-500 max-w-md">
      {{ description }}
    </p>
  </div>
</template>
