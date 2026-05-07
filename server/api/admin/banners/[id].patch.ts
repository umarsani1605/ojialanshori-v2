import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateAdminBannerBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminBannerBody)
  const db = useDb(event)

  const existing = await db.query.banners.findFirst({
    where: (b, { eq: eqFn }) => eqFn(b.id, id),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Banner tidak ditemukan.' })
  }

  await db.update(schema.banners)
    .set({
      text: body.text,
      link: body.link ?? null,
      isActive: body.isActive ?? existing.isActive,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
    })
    .where(eq(schema.banners.id, id))

  const updated = await db.query.banners.findFirst({
    where: (b, { eq: eqFn }) => eqFn(b.id, id),
  })

  return { data: updated }
})
