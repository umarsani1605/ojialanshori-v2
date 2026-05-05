import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import { useGalleryLightbox } from '../../app/composables/useGalleryLightbox'

describe('useGalleryLightbox', () => {
  it('opens on the requested item and navigates circularly', () => {
    const items = ref([
      { id: 1, title: 'Satu' },
      { id: 2, title: 'Dua' },
      { id: 3, title: 'Tiga' },
    ])

    const lightbox = useGalleryLightbox(computed(() => items.value))

    expect(lightbox.isOpen.value).toBe(false)
    expect(lightbox.activeItem.value).toBeNull()

    lightbox.open(1)

    expect(lightbox.isOpen.value).toBe(true)
    expect(lightbox.activeIndex.value).toBe(1)
    expect(lightbox.activeItem.value?.title).toBe('Dua')

    lightbox.next()
    expect(lightbox.activeIndex.value).toBe(2)
    expect(lightbox.activeItem.value?.title).toBe('Tiga')

    lightbox.next()
    expect(lightbox.activeIndex.value).toBe(0)
    expect(lightbox.activeItem.value?.title).toBe('Satu')

    lightbox.prev()
    expect(lightbox.activeIndex.value).toBe(2)
    expect(lightbox.activeItem.value?.title).toBe('Tiga')
  })

  it('ignores invalid indices and closes cleanly', () => {
    const items = ref([{ id: 1, title: 'Satu' }])

    const lightbox = useGalleryLightbox(computed(() => items.value))

    lightbox.open(5)

    expect(lightbox.isOpen.value).toBe(false)
    expect(lightbox.activeItem.value).toBeNull()

    lightbox.open(0)
    expect(lightbox.isOpen.value).toBe(true)

    lightbox.close()
    expect(lightbox.isOpen.value).toBe(false)
    expect(lightbox.activeIndex.value).toBe(0)
  })
})
