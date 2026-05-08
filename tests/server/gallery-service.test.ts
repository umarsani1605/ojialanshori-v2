import { afterEach, describe, expect, it, vi } from 'vitest'

const countGalleryItems = vi.fn()
const deleteGalleryItem = vi.fn()
const findGalleryItemById = vi.fn()
const findMaxGalleryOrder = vi.fn()
const insertGalleryItem = vi.fn()
const listGallery = vi.fn()
const reorderGalleryItems = vi.fn()
const updateGalleryItem = vi.fn()

vi.mock('~~/server/repositories/gallery/galleryRepository', () => ({
  countGalleryItems,
  deleteGalleryItem,
  findGalleryItemById,
  findMaxGalleryOrder,
  insertGalleryItem,
  listGallery,
  reorderGalleryItems,
  updateGalleryItem,
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('createGalleryItem', () => {
  it('starts gallery ordering from 1 for the first uploaded image', async () => {
    countGalleryItems.mockResolvedValue(0)
    findMaxGalleryOrder.mockResolvedValue(0)
    insertGalleryItem.mockResolvedValue(10)
    findGalleryItemById.mockResolvedValue({ id: 10, title: 'Foto Baru', order: 1 })

    const { createGalleryItem } = await import('~~/server/services/gallery/galleryService')

    await createGalleryItem({} as never, {
      title: 'Foto Baru',
      imagePath: '/uploads/new.jpg',
    })

    expect(insertGalleryItem).toHaveBeenCalledWith({} as never, {
      title: 'Foto Baru',
      imagePath: '/uploads/new.jpg',
      order: 1,
    })
  })

  it('rejects when the gallery already has 8 items', async () => {
    countGalleryItems.mockResolvedValue(8)

    const { createGalleryItem } = await import('~~/server/services/gallery/galleryService')

    await expect(createGalleryItem({} as never, {
      title: 'Foto Baru',
      imagePath: '/uploads/new.jpg',
    })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Galeri homepage maksimal 8 foto.',
    })

    expect(insertGalleryItem).not.toHaveBeenCalled()
  })
})

describe('patchGalleryItem', () => {
  it('reorders gallery items using 1-based positions', async () => {
    findGalleryItemById.mockResolvedValue({ id: 2, title: 'Foto 2', order: 2, imagePath: '/2.jpg' })
    listGallery.mockResolvedValue([
      { id: 1, title: 'Foto 1', order: 1, imagePath: '/1.jpg' },
      { id: 2, title: 'Foto 2', order: 2, imagePath: '/2.jpg' },
      { id: 3, title: 'Foto 3', order: 3, imagePath: '/3.jpg' },
    ])

    const { patchGalleryItem } = await import('~~/server/services/gallery/galleryService')

    await patchGalleryItem({} as never, 2, { order: 1 })

    expect(reorderGalleryItems).toHaveBeenCalledWith({} as never, [
      { id: 2, order: 1 },
      { id: 1, order: 2 },
      { id: 3, order: 3 },
    ])
  })
})
