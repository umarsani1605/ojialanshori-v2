<script setup lang="ts">
type Size = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const props = withDefaults(defineProps<{
  name: string | null | undefined
  src?: string | null
  size?: Size
  class?: string
}>(), {
  size: 'sm',
})

const initials = computed(() => getInitials(props.name))
const bg = computed(() => getAvatarColor(props.name))

const sizeClassMap: Record<Size, string> = {
  '3xs': 'text-[10px]',
  '2xs': 'text-[10px]',
  'xs': 'text-xs',
  'sm': 'text-xs',
  'md': 'text-sm',
  'lg': 'text-base',
  'xl': 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl',
}
</script>

<template>
  <UAvatar
    v-if="src"
    :src="src"
    :alt="name ?? ''"
    :size="size"
    :class="props.class"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded-full font-semibold text-white select-none"
    :class="[
      sizeClassMap[size],
      props.class,
      {
        'size-4': size === '3xs',
        'size-5': size === '2xs',
        'size-6': size === 'xs',
        'size-7': size === 'sm',
        'size-8': size === 'md',
        'size-9': size === 'lg',
        'size-10': size === 'xl',
        'size-12': size === '2xl',
        'size-14': size === '3xl',
      },
    ]"
    :style="{ backgroundColor: bg }"
    :aria-label="name ?? ''"
  >
    {{ initials }}
  </span>
</template>
