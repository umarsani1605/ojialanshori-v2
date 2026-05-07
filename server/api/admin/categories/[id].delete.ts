import { count, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const { id } = validateRouteIdParams(event.context.params)
  const db = useDb(event)

  const existing = await db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.id, id),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan.' })
  }

  const [postsCount] = await db
    .select({ count: count() })
    .from(schema.posts)
    .where(eq(schema.posts.categoryId, id))

  if ((postsCount?.count ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${postsCount?.count} artikel.`,
    })
  }

  const [childCount] = await db
    .select({ count: count() })
    .from(schema.categories)
    .where(eq(schema.categories.parentId, id))

  if ((childCount?.count ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      message: 'Kategori tidak dapat dihapus karena memiliki sub-kategori.',
    })
  }

  await db.delete(schema.categories).where(eq(schema.categories.id, id))

  return { success: true }
})
