<script setup lang="ts">
withDefaults(
  defineProps<{
    alt?: string;
    bgClass?: string;
    image: string;
    imageClass?: string;
    maxWidthClass?: string;
    name: string;
  }>(),
  {
    alt: undefined,
    bgClass: "bg-slate-200",
    imageClass: "object-cover",
    maxWidthClass: "max-w-[220px]",
  },
);
</script>

<template>
  <figure class="text-center">
    <div
      :class="[
        'aspect-square overflow-hidden mx-auto rounded-3xl',
        bgClass,
        maxWidthClass,
      ]"
    >
      <NuxtImg
        v-if="isManagedImage(image)"
        :src="image"
        :alt="alt ?? name"
        width="220"
        height="220"
        format="webp"
        loading="lazy"
        class="h-full w-full"
        :class="imageClass"
      />
      <img
        v-else
        :src="image"
        :alt="alt ?? name"
        loading="lazy"
        decoding="async"
        width="220"
        height="220"
        class="h-full w-full"
        :class="imageClass"
      />
    </div>
    <figcaption class="mt-5 font-bold text-sm md:text-base">
      {{ name }}
    </figcaption>
  </figure>
</template>
