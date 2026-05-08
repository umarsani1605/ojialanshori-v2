import { eq } from 'drizzle-orm'
import { pages } from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const template = getRouterParam(event, 'template')
  if (!template) throw createError({ statusCode: 400, statusMessage: 'Template required' })

  const db = useDb(event)
  const page = await db.query.pages.findFirst({
    where: eq(pages.template, template),
  })

  if (!page) {
    // If a page doesn't exist for the template, we can either return a 404
    // or return a stub. Returning a 404 is cleaner so the frontend knows it's empty.
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  return { data: page }
})