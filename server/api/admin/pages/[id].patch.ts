import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateAdminPageBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminPageBody)
  const db = useDb(event)

  const existing = await db.query.pages.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, id),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan.' })
  }

  const slugConflict = await db.query.pages.findFirst({
    where: (p, { and: andFn, eq: eqFn, ne: neFn }) =>
      andFn(eqFn(p.slug, body.slug), neFn(p.id, id)),
  })

  if (slugConflict) {
    throw createError({ statusCode: 409, message: 'Slug halaman sudah digunakan.' })
  }

  await db.update(schema.pages)
    .set({
      title: body.title,
      slug: body.slug,
      content: body.content,
      status: body.status,
    })
    .where(eq(schema.pages.id, id))

  const updated = await db.query.pages.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, id),
  })

  return { data: updated }
})
