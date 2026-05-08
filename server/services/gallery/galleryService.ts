import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import {
  countGalleryItems,
  deleteGalleryItem,
  findGalleryItemById,
  findMaxGalleryOrder,
  insertGalleryItem,
  listGallery,
  reorderGalleryItems,
  updateGalleryItem,
} from '#server/repositories/gallery/galleryRepository'

type Database = MySql2Database<typeof schema>
export const MAX_GALLERY_ITEMS = 8

type GalleryBody = {
  title: string
  imagePath: string
  order?: number
}

type GalleryPatchBody = {
  title?: string
  order?: number
}

export async function listGalleryForAdmin(db: Database) {
  const items = await listGallery(db)
  return items.map((item, index) => ({
    ...item,
    order: index + 1,
  }))
}

export async function createGalleryItem(db: Database, body: GalleryBody) {
  const totalItems = await countGalleryItems(db)
  if (totalItems >= MAX_GALLERY_ITEMS) {
    throw createError({
      statusCode: 409,
      message: `Galeri homepage maksimal ${MAX_GALLERY_ITEMS} foto.`,
    })
  }

  const maxOrder = await findMaxGalleryOrder(db)
  const order = Math.max(1, body.order ?? maxOrder + 1)

  const insertId = await insertGalleryItem(db, {
    title: body.title,
    imagePath: body.imagePath,
    order,
  })
  return findGalleryItemById(db, insertId)
}

export async function patchGalleryItem(db: Database, id: number, body: GalleryPatchBody) {
  const existing = await findGalleryItemById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Item galeri tidak ditemukan.' })
  }

  const { order, ...rest } = body

  if (Object.keys(rest).length > 0) {
    await updateGalleryItem(db, id, rest)
  }

  if (typeof order === 'number') {
    const items = await listGallery(db)
    const remainingItems = items.filter(item => item.id !== id)
    const nextIndex = Math.min(Math.max(order, 1), remainingItems.length + 1) - 1
    remainingItems.splice(nextIndex, 0, { ...existing, ...rest, order })
    await reorderGalleryItems(db, remainingItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    })))
  }

  return findGalleryItemById(db, id)
}

export async function removeGalleryItem(db: Database, id: number) {
  const existing = await findGalleryItemById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Item galeri tidak ditemukan.' })
  }
  await deleteGalleryItem(db, id)
  const items = await listGallery(db)
  await reorderGalleryItems(db, items.map((item, index) => ({
    id: item.id,
    order: index + 1,
  })))
  return existing.imagePath
}
