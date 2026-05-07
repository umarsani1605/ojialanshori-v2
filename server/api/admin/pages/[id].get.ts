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

  const page = await db.query.pages.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  })

  if (!page) {
    throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  }

  return { data: page }
})
