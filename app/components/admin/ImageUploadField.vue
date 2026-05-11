<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | null
    accept?: string
    hint?: string
    shape?: 'rect' | 'circle'
  }>(),
  {
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG, PNG, WebP · Maks 5MB',
    shape: 'rect',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'file', file: File): void
}>()

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  emit('file', file)
  emit('update:modelValue', URL.createObjectURL(file))
}

const previewClass = computed(() =>
  props.shape === 'circle'
    ? 'mx-auto mb-3 size-24 rounded-full object-cover'
    : 'mx-auto mb-3 max-h-48 rounded object-contain',
)
</script>

<template>
  <div class="rounded-lg border-2 border-dashed p-4 text-center">
    <img
      v-if="props.modelValue"
      :src="props.modelValue"
      alt="Preview"
      :class="previewClass"
    />
    <label class="cursor-pointer">
      <span class="text-sm text-primary">
        {{ props.modelValue ? 'Ganti foto' : 'Pilih foto' }}
      </span>
      <input :accept="props.accept" type="file" class="sr-only" @change="onChange" />
    </label>
    <p class="mt-1 text-xs text-muted">{{ props.hint }}</p>
  </div>
</template>
