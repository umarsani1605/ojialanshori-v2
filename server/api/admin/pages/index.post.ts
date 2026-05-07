import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminPageBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const body = await readValidatedBody(event, validateAdminPageBody)
  const db = useDb(event)

  const existing = await db.query.pages.findFirst({
    where: (p, { eq }) => eq(p.slug, body.slug),
  })

  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug halaman sudah digunakan.' })
  }

  const [result] = await db.insert(schema.pages).values({
    title: body.title,
    slug: body.slug,
    content: body.content,
    status: body.status,
  })

  const inserted = await db.query.pages.findFirst({
    where: (p, { eq }) => eq(p.id, result.insertId),
  })

  return { data: inserted }
})
