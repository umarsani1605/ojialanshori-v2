<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-7">
      <div class="flex items-center gap-3">
        <UButton
          v-if="to"
          :to="to"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          class="text-gray-600"
        />
        <h1 v-if="title" class="lg:text-2xl text-xl font-bold text-gray-900">
          {{ title }}
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <slot name="action" />
      </div>
    </div>

    <!-- Loading State -->
    <UCard v-if="loading">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-7 h-7 animate-spin text-primary" />
      </div>
    </UCard>

    <!-- Default Slot -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
  },
  to: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

useHead({
  title: () => props.title ? `${props.title} - Omah Ngaji` : 'Omah Ngaji Al-Anshori',
})
</script>
