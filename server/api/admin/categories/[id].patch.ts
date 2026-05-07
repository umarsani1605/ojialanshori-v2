import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { slugify } from '#server/utils/santriPostEditor'
import { validateRouteIdParams, validateAdminCategoryBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminCategoryBody)
  const db = useDb(event)

  const existing = await db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.id, id),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan.' })
  }

  const slug = body.slug ?? slugify(body.name)

  const slugConflict = await db.query.categories.findFirst({
    where: (c, { and: andFn, eq: eqFn, ne: neFn }) =>
      andFn(eqFn(c.slug, slug), neFn(c.id, id)),
  })

  if (slugConflict) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  if (body.parentId !== null && body.parentId !== id) {
    const parent = await db.query.categories.findFirst({
      where: (c, { eq: eqFn }) => eqFn(c.id, body.parentId!),
    })
    if (!parent) {
      throw createError({ statusCode: 400, message: 'Kategori parent tidak ditemukan.' })
    }
  }

  await db.update(schema.categories)
    .set({
      name: body.name,
      slug,
      type: body.type,
      parentId: body.parentId,
    })
    .where(eq(schema.categories.id, id))

  const updated = await db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.id, id),
    with: { parent: { columns: { id: true, name: true } } },
  })

  return { data: updated }
})
