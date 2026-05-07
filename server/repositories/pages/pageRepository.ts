import { desc, eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

export async function listPages(db: Database) {
  return db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      slug: schema.pages.slug,
      status: schema.pages.status,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .orderBy(desc(schema.pages.updatedAt))
}

export async function findPageById(db: Database, id: number) {
  return db.query.pages.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, id),
  })
}

export async function findPageBySlug(db: Database, slug: string) {
  return db.query.pages.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.slug, slug),
  })
}

export async function findPageBySlugExcluding(db: Database, slug: string, excludeId: number) {
  return db.query.pages.findFirst({
    where: (p, { and: andFn, eq: eqFn, ne: neFn }) =>
      andFn(eqFn(p.slug, slug), neFn(p.id, excludeId)),
  })
}

export async function insertPage(
  db: Database,
  values: { title: string; slug: string; content: string; status: string },
) {
  const [result] = await db.insert(schema.pages).values(values as typeof schema.pages.$inferInsert)
  return result.insertId
}

export async function updatePage(
  db: Database,
  id: number,
  values: { title: string; slug: string; content: string; status: string },
) {
  await db.update(schema.pages)
    .set(values as Partial<typeof schema.pages.$inferInsert>)
    .where(eq(schema.pages.id, id))
}

export async function deletePage(db: Database, id: number) {
  await db.delete(schema.pages).where(eq(schema.pages.id, id))
}
