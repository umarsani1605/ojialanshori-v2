import { asc, count, eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

export async function listGallery(db: Database) {
  return db.select().from(schema.gallery).orderBy(asc(schema.gallery.order), asc(schema.gallery.id))
}

export async function findGalleryItemById(db: Database, id: number) {
  return db.query.gallery.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.id, id),
  })
}

export async function insertGalleryItem(
  db: Database,
  values: { title: string; imagePath: string; order: number },
) {
  const [result] = await db.insert(schema.gallery).values(values)
  return result.insertId
}

export async function countGalleryItems(db: Database) {
  const [result] = await db.select({ count: count() }).from(schema.gallery)
  return result?.count ?? 0
}

export async function findMaxGalleryOrder(db: Database) {
  const items = await db.select({ order: schema.gallery.order }).from(schema.gallery).orderBy(asc(schema.gallery.order))
  return items.at(-1)?.order ?? 0
}

export async function updateGalleryItem(
  db: Database,
  id: number,
  values: { title?: string; order?: number },
) {
  await db.update(schema.gallery).set(values).where(eq(schema.gallery.id, id))
}

export async function reorderGalleryItems(
  db: Database,
  items: Array<{ id: number; order: number }>,
) {
  await Promise.all(items.map(item =>
    db.update(schema.gallery).set({ order: item.order }).where(eq(schema.gallery.id, item.id)),
  ))
}

export async function deleteGalleryItem(db: Database, id: number) {
  await db.delete(schema.gallery).where(eq(schema.gallery.id, id))
}
