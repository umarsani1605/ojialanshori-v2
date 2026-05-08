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

  const body = await readBody(event)
  if (!body || !body.meta) {
     throw createError({ statusCode: 400, statusMessage: 'Body must contain meta' })
  }

  const db = useDb(event)
  
  // Upsert pattern (update if exists, insert if not). 
  // Since pages are fixed, we'll try to find it first.
  const existingPage = await db.query.pages.findFirst({
    where: eq(pages.template, template),
  })

  if (existingPage) {
    await db.update(pages)
      .set({ 
        title: body.title || existingPage.title,
        meta: body.meta, 
        updatedAt: new Date() 
      })
      .where(eq(pages.template, template))
  } else {
    // If it didn't exist in DB yet, create it.
    await db.insert(pages).values({
      title: body.title || template,
      template: template,
      meta: body.meta,
    })
  }

  return { success: true }
})