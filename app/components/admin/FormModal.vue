<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    /** Mode edit vs create — menentukan title default. */
    isEdit?: boolean
    /** Nama entity, dipakai untuk auto-title "Edit X" / "Tambah X". */
    entityLabel?: string
    /** Override title manual; kalau di-set, abaikan entityLabel/isEdit. */
    title?: string
    loading?: boolean
    submitLabel?: string
    cancelLabel?: string
    /** Lebar modal: false=default, true=max-w-4xl untuk form panjang. */
    wide?: boolean
  }>(),
  {
    isEdit: false,
    entityLabel: '',
    title: '',
    loading: false,
    submitLabel: 'Simpan',
    cancelLabel: 'Batal',
    wide: false,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit'): void
}>()

const computedTitle = computed(() => {
  if (props.title) return props.title
  if (!props.entityLabel) return props.isEdit ? 'Edit' : 'Tambah'
  return `${props.isEdit ? 'Edit' : 'Tambah'} ${props.entityLabel}`
})

const modalUi = computed(() =>
  props.wide ? { content: 'max-w-4xl' } : undefined,
)

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="computedTitle"
    :ui="modalUi"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <slot />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          :label="props.cancelLabel"
          :disabled="props.loading"
          @click="close"
        />
        <UButton
          :label="props.submitLabel"
          :loading="props.loading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
