import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import {
  deleteGalleryItem,
  findGalleryItemById,
  insertGalleryItem,
  listGallery,
  updateGalleryItem,
} from '#server/repositories/gallery/galleryRepository'

type Database = MySql2Database<typeof schema>

type GalleryBody = {
  title: string
  imagePath: string
  album?: string | null
  order?: number
}

type GalleryPatchBody = {
  title?: string
  album?: string | null
  order?: number
}

export async function listGalleryForAdmin(db: Database) {
  return listGallery(db)
}

export async function createGalleryItem(db: Database, body: GalleryBody) {
  const insertId = await insertGalleryItem(db, {
    title: body.title,
    imagePath: body.imagePath,
    album: body.album ?? null,
    order: body.order ?? 0,
  })
  return findGalleryItemById(db, insertId)
}

export async function patchGalleryItem(db: Database, id: number, body: GalleryPatchBody) {
  const existing = await findGalleryItemById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Item galeri tidak ditemukan.' })
  }

  await updateGalleryItem(db, id, body)
  return findGalleryItemById(db, id)
}

export async function removeGalleryItem(db: Database, id: number) {
  const existing = await findGalleryItemById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Item galeri tidak ditemukan.' })
  }
  await deleteGalleryItem(db, id)
  return existing.imagePath
}
