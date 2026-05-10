import { asc, count, eq, inArray } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

export async function listCategories(db: Database) {
  const cats = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.type), asc(schema.categories.name))

  const parentIds = [...new Set(cats.map(c => c.parentId).filter((id): id is number => id !== null))]
  const parentMap = new Map<number, { id: number; name: string }>()
  if (parentIds.length > 0) {
    const parents = await db
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(inArray(schema.categories.id, parentIds))
    parents.forEach(p => parentMap.set(p.id, p))
  }

  return cats.map(cat => ({
    ...cat,
    parent: cat.parentId !== null ? (parentMap.get(cat.parentId) ?? null) : null,
  }))
}

export async function findCategoryById(db: Database, id: number) {
  const [cat] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .limit(1)

  if (!cat) return undefined

  let parent: { id: number; name: string } | null = null
  if (cat.parentId !== null) {
    const [p] = await db
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(eq(schema.categories.id, cat.parentId))
      .limit(1)
    parent = p ?? null
  }

  return { ...cat, parent }
}

export async function findCategoryBySlug(db: Database, slug: string) {
  return db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.slug, slug),
  })
}

export async function findCategoryBySlugExcluding(db: Database, slug: string, excludeId: number) {
  return db.query.categories.findFirst({
    where: (c, { and: andFn, eq: eqFn, ne: neFn }) =>
      andFn(eqFn(c.slug, slug), neFn(c.id, excludeId)),
  })
}

export async function countPostsInCategory(db: Database, categoryId: number) {
  const [row] = await db
    .select({ count: count() })
    .from(schema.posts)
    .where(eq(schema.posts.categoryId, categoryId))
  return row?.count ?? 0
}

export async function countChildCategories(db: Database, parentId: number) {
  const [row] = await db
    .select({ count: count() })
    .from(schema.categories)
    .where(eq(schema.categories.parentId, parentId))
  return row?.count ?? 0
}

export async function insertCategory(
  db: Database,
  values: { name: string; slug: string; type: string; parentId: number | null },
) {
  const [result] = await db.insert(schema.categories).values(values as typeof schema.categories.$inferInsert)
  return result.insertId
}

export async function updateCategory(
  db: Database,
  id: number,
  values: { name: string; slug: string; type: string; parentId: number | null },
) {
  await db.update(schema.categories)
    .set(values as Partial<typeof schema.categories.$inferInsert>)
    .where(eq(schema.categories.id, id))
}

export async function deleteCategory(db: Database, id: number) {
  await db.delete(schema.categories).where(eq(schema.categories.id, id))
}
