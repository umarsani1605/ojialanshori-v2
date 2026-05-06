import { asc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) {
    return []
  }

  const db = useDb(event)

  return await db.select({
    id: schema.testimonials.id,
    name: schema.testimonials.name,
    title: schema.testimonials.title,
    content: schema.testimonials.content,
    avatarPath: schema.testimonials.avatar,
    order: schema.testimonials.order,
  })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.isActive, true))
    .orderBy(asc(schema.testimonials.order), asc(schema.testimonials.id))
}, {
  maxAge: 60,
  name: 'public-testimonials',
})
