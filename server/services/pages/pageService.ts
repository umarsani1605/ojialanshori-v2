import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import {
  deletePage,
  findPageById,
  findPageBySlug,
  findPageBySlugExcluding,
  insertPage,
  listPages,
  updatePage,
} from '#server/repositories/pages/pageRepository'

type Database = MySql2Database<typeof schema>

type PageBody = {
  title: string
  slug: string
  content: string
  status: string
}

export async function listPagesForAdmin(db: Database) {
  return listPages(db)
}

export async function getPageForAdmin(db: Database, id: number) {
  const page = await findPageById(db, id)
  if (!page) {
    throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  }
  return page
}

export async function createPage(db: Database, body: PageBody) {
  const existing = await findPageBySlug(db, body.slug)
  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug halaman sudah digunakan.' })
  }

  const insertId = await insertPage(db, body)
  return findPageById(db, insertId)
}

export async function patchPage(db: Database, id: number, body: PageBody) {
  const existing = await findPageById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  }

  const slugConflict = await findPageBySlugExcluding(db, body.slug, id)
  if (slugConflict) {
    throw createError({ statusCode: 409, message: 'Slug halaman sudah digunakan.' })
  }

  await updatePage(db, id, body)
  return findPageById(db, id)
}

export async function removePage(db: Database, id: number) {
  const existing = await findPageById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  }
  await deletePage(db, id)
}
