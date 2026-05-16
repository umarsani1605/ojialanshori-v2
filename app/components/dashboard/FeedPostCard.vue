<script setup lang="ts">
const props = defineProps<{
  to: string;
  title: string;
  category: string;
  date: string | Date | null;
  featuredImage?: string | null;
  target?: string;
}>();

const dateFormatted = computed(() =>
  formatDate(props.date, "Tanggal belum tersedia"),
);
</script>

<template>
  <NuxtLink :to="to" :target="target" class="group flex items-center gap-4">
    <div
      class="w-28 aspect-3/2 shrink-0 overflow-hidden rounded-lg bg-slate-100"
    >
      <img
        v-if="featuredImage"
        :src="featuredImage"
        :alt="title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-dimmed"
      >
        <UIcon name="i-ph-image" class="size-8" />
      </div>
    </div>
    <div class="flex flex-col gap-2 md:flex-row min-w-0 flex-1">
      <div class="flex flex-col flex-1 gap-1.5">
        <p
          class="line-clamp-2 text-md font-medium leading-snug transition-colors group-hover:text-primary"
        >
          {{ title }}
        </p>
        <p class="text-xs text-dimmed">{{ category }} • {{ dateFormatted }}</p>
      </div>
      <div class="flex items-start shrink-0">
        <slot name="trailing" />
      </div>
    </div>
  </NuxtLink>
</template>
