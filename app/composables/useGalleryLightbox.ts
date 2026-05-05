import type { ComputedRef, Ref } from 'vue'

type MaybeRefItems<T> = Ref<T[]> | ComputedRef<T[]>

export function useGalleryLightbox<T>(items: MaybeRefItems<T>) {
  const isOpen = ref(false)
  const activeIndex = ref(0)

  const activeItem = computed(() => {
    if (!isOpen.value) {
      return null
    }

    return items.value[activeIndex.value] ?? null
  })
  const hasMultipleItems = computed(() => items.value.length > 1)

  function open(index: number) {
    if (index < 0 || index >= items.value.length) {
      return
    }

    activeIndex.value = index
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function prev() {
    if (!items.value.length) {
      return
    }

    activeIndex.value =
      (activeIndex.value - 1 + items.value.length) % items.value.length
  }

  function next() {
    if (!items.value.length) {
      return
    }

    activeIndex.value = (activeIndex.value + 1) % items.value.length
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen.value) {
      return
    }

    if (event.key === 'Escape') {
      close()
      return
    }

    if (event.key === 'ArrowLeft') {
      prev()
      return
    }

    if (event.key === 'ArrowRight') {
      next()
    }
  }

  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown)
    })
  }

  return {
    activeIndex,
    activeItem,
    close,
    hasMultipleItems,
    isOpen,
    next,
    open,
    prev,
  }
}
