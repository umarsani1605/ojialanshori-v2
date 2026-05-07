import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { slugify } from '#server/utils/santriPostEditor'
import { validateAdminCategoryBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const body = await readValidatedBody(event, validateAdminCategoryBody)
  const db = useDb(event)

  const slug = body.slug ?? slugify(body.name)

  const existing = await db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.slug, slug),
  })

  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug kategori sudah digunakan.' })
  }

  if (body.parentId !== null) {
    const parent = await db.query.categories.findFirst({
      where: (c, { eq: eqFn }) => eqFn(c.id, body.parentId!),
    })
    if (!parent) {
      throw createError({ statusCode: 400, message: 'Kategori parent tidak ditemukan.' })
    }
  }

  const [result] = await db.insert(schema.categories).values({
    name: body.name,
    slug,
    type: body.type,
    parentId: body.parentId,
  })

  const inserted = await db.query.categories.findFirst({
    where: (c, { eq: eqFn }) => eqFn(c.id, result.insertId),
    with: { parent: { columns: { id: true, name: true } } },
  })

  return { data: inserted }
})
