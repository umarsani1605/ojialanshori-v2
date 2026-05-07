import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminBannerBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const body = await readValidatedBody(event, validateAdminBannerBody)
  const db = useDb(event)

  const [result] = await db.insert(schema.banners).values({
    text: body.text,
    link: body.link ?? null,
    isActive: body.isActive ?? false,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
  })

  const inserted = await db.query.banners.findFirst({
    where: (b, { eq }) => eq(b.id, result.insertId),
  })

  return { data: inserted }
})
