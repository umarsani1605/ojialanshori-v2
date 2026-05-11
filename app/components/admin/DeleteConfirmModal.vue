<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    loading?: boolean
    confirmLabel?: string
  }>(),
  {
    title: 'Hapus item',
    description: 'Apakah kamu yakin ingin menghapus item ini? Tindakan ini tidak bisa dibatalkan.',
    loading: false,
    confirmLabel: 'Hapus',
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="props.open" :title="props.title" @update:open="emit('update:open', $event)">
    <template #body>
      <p class="text-sm">{{ props.description }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" label="Batal" :disabled="props.loading" @click="close" />
        <UButton
          color="error"
          :label="props.confirmLabel"
          :loading="props.loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
