import { and, eq, gte, isNull, lte, or, type SQL } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return null

  const db = useDb(event)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const banner = await db.query.banners.findFirst({
    where: and(
      eq(schema.banners.isActive, true),
      or(
        isNull(schema.banners.startDate),
        lte(schema.banners.startDate, today),
      ) as SQL,
      or(
        isNull(schema.banners.endDate),
        gte(schema.banners.endDate, today),
      ) as SQL,
    ),
  })

  return banner ?? null
}, {
  maxAge: 60,
  name: 'public-banner',
})
