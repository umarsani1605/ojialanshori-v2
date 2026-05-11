import { eq } from 'drizzle-orm'
import { pages } from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { updatePageSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const template = getRouterParam(event, 'template')
  if (!template) throw createError({ statusCode: 400, statusMessage: 'Template required' })

  const body = await readValidatedBody(event, zValidator(updatePageSchema))
  const db = useDb(event)

  // Upsert: update kalau sudah ada, insert kalau belum.
  const existingPage = await db.query.pages.findFirst({
    where: eq(pages.template, template),
  })

  if (existingPage) {
    await db.update(pages)
      .set({
        title: body.title || existingPage.title,
        meta: body.meta,
        updatedAt: new Date(),
      })
      .where(eq(pages.template, template))
  } else {
    await db.insert(pages).values({
      title: body.title || template,
      template: template,
      meta: body.meta,
    })
  }

  return { success: true }
})
