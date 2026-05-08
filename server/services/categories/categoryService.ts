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

type CategoryBody = {
  name: string
}

export async function listCategoriesForAdmin(db: Database) {
  const categories = await listCategories(db)
  return categories.filter(category => category.type === 'pena_santri')
}

export async function createCategory(db: Database, body: CategoryBody) {
  const slug = slugify(body.name)

  const existing = await findCategoryBySlug(db, slug)
  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  const insertId = await insertCategory(db, { name: body.name, slug, type: 'pena_santri', parentId: null })
  return findCategoryById(db, insertId)
}

export async function patchCategory(db: Database, id: number, body: CategoryBody) {
  const existing = await findCategoryById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan.' })
  }

  const slug = slugify(body.name)

  const slugConflict = await findCategoryBySlugExcluding(db, slug, id)
  if (slugConflict) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  await updateCategory(db, id, { name: body.name, slug, type: 'pena_santri', parentId: null })
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
