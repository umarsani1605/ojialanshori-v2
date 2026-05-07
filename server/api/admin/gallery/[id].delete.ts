import { eq } from 'drizzle-orm'

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

  const existing = await db.query.gallery.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.id, id),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Item galeri tidak ditemukan.' })
  }

  await db.delete(schema.gallery).where(eq(schema.gallery.id, id))

  return { success: true }
})
