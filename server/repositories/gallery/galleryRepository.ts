import { asc, eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

export async function listGallery(db: Database) {
  return db.select().from(schema.gallery).orderBy(asc(schema.gallery.order))
}

export async function findGalleryItemById(db: Database, id: number) {
  return db.query.gallery.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.id, id),
  })
}

export async function insertGalleryItem(
  db: Database,
  values: { title: string; imagePath: string; album: string | null; order: number },
) {
  const [result] = await db.insert(schema.gallery).values(values)
  return result.insertId
}

export async function updateGalleryItem(
  db: Database,
  id: number,
  values: { title?: string; album?: string | null; order?: number },
) {
  await db.update(schema.gallery).set(values).where(eq(schema.gallery.id, id))
}

export async function deleteGalleryItem(db: Database, id: number) {
  await db.delete(schema.gallery).where(eq(schema.gallery.id, id))
}
