<script setup lang="ts">
type GalleryItem = {
  id: number
  imagePath: string
  order: number
  title: string
}

const props = defineProps<{
  activeIndex: number
  items: GalleryItem[]
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  next: []
  prev: []
  'update:open': [value: boolean]
}>()

const activeItem = computed(() => props.items[props.activeIndex] ?? null)
const hasMultipleItems = computed(() => props.items.length > 1)

function handleOpenChange(value: boolean) {
  emit('update:open', value)

  if (!value) {
    emit('close')
  }
}
</script>

<template>
  <UModal
    :open="open"
    fullscreen
    :transition="true"
    :ui="{
      content: 'bg-slate-950/10 shadow-none ring-0',
    }"
    @update:open="handleOpenChange"
  >
    <template #content>
      <div class="flex min-h-screen flex-col text-white">
        <div class="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p class="text-sm text-white/70">
              {{ activeIndex + 1 }} / {{ items.length }}
            </p>
            <h3 class="mt-1 text-lg font-semibold">
              {{ activeItem?.title }}
            </h3>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-ph-x"
            class="text-white hover:bg-white/10"
            aria-label="Tutup lightbox"
            @click="emit('close')"
          />
        </div>

        <div class="flex flex-1 items-center justify-center gap-3 px-4 pb-6 md:gap-6 md:px-6">
          <UButton
            v-if="hasMultipleItems"
            color="neutral"
            variant="ghost"
            icon="i-ph-caret-left"
            class="hidden md:inline-flex text-white hover:bg-white/10"
            aria-label="Foto sebelumnya"
            @click="emit('prev')"
          />

          <div class="flex w-full max-w-6xl flex-col items-center justify-center gap-4">
            <div class="overflow-hidden rounded-2xl bg-white/5">
              <NuxtImg
                v-if="activeItem"
                :src="activeItem.imagePath"
                :alt="activeItem.title"
                class="max-h-[72vh] w-auto max-w-full object-contain"
                loading="eager"
              />
            </div>
            <div v-if="hasMultipleItems" class="flex items-center gap-3 md:hidden">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-ph-caret-left"
                class="text-white hover:bg-white/10"
                aria-label="Foto sebelumnya"
                @click="emit('prev')"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-ph-caret-right"
                class="text-white hover:bg-white/10"
                aria-label="Foto berikutnya"
                @click="emit('next')"
              />
            </div>
          </div>

          <UButton
            v-if="hasMultipleItems"
            color="neutral"
            variant="ghost"
            icon="i-ph-caret-right"
            class="hidden md:inline-flex text-white hover:bg-white/10"
            aria-label="Foto berikutnya"
            @click="emit('next')"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
