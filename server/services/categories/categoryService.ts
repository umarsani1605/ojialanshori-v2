import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import { slugify } from '#server/utils/slugify'
import {
  countChildCategories,
  countPostsInCategory,
  deleteCategory,
  findCategoryById,
  findCategoryBySlug,
  findCategoryBySlugExcluding,
  insertCategory,
  listCategories,
  updateCategory,
} from '#server/repositories/categories/categoryRepository'

type Database = MySql2Database<typeof schema>
type CategoryType = typeof schema.categories.$inferInsert['type']

type CategoryBody = {
  name: string
  slug?: string | null
  type: CategoryType
  parentId: number | null
}

export async function listCategoriesForAdmin(db: Database) {
  return listCategories(db)
}

export async function createCategory(db: Database, body: CategoryBody) {
  const slug = body.slug?.trim() || slugify(body.name)

  const existing = await findCategoryBySlug(db, slug)
  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  if (body.parentId !== null) {
    const parent = await findCategoryById(db, body.parentId)
    if (!parent) {
      throw createError({ statusCode: 400, message: 'Kategori parent tidak ditemukan.' })
    }
  }

  const insertId = await insertCategory(db, { name: body.name, slug, type: body.type, parentId: body.parentId })
  return findCategoryById(db, insertId)
}

export async function patchCategory(db: Database, id: number, body: CategoryBody) {
  const existing = await findCategoryById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan.' })
  }

  const slug = body.slug?.trim() || slugify(body.name)

  const slugConflict = await findCategoryBySlugExcluding(db, slug, id)
  if (slugConflict) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  if (body.parentId !== null && body.parentId !== id) {
    const parent = await findCategoryById(db, body.parentId)
    if (!parent) {
      throw createError({ statusCode: 400, message: 'Kategori parent tidak ditemukan.' })
    }
  }

  await updateCategory(db, id, { name: body.name, slug, type: body.type, parentId: body.parentId })
  return findCategoryById(db, id)
}

export async function removeCategory(db: Database, id: number) {
  const existing = await findCategoryById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan.' })
  }

  const postsCount = await countPostsInCategory(db, id)
  if (postsCount > 0) {
    throw createError({
      statusCode: 409,
      message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${postsCount} artikel.`,
    })
  }

  const childCount = await countChildCategories(db, id)
  if (childCount > 0) {
    throw createError({ statusCode: 409, message: 'Kategori tidak dapat dihapus karena memiliki sub-kategori.' })
  }

  await deleteCategory(db, id)
}
