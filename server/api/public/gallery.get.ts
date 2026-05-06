import { asc } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'

export default defineCachedEventHandler(
  async (event) => {
    if (!isMysqlConfigured(event)) {
      return []
    }

    const db = useDb(event)

    return await db
      .select({
        id: schema.gallery.id,
        title: schema.gallery.title,
        imagePath: schema.gallery.imagePath,
        album: schema.gallery.album,
        order: schema.gallery.order,
      })
      .from(schema.gallery)
      .orderBy(asc(schema.gallery.order), asc(schema.gallery.id))
      .limit(8)
  },
  {
    maxAge: 60,
    name: 'public-gallery',
  },
)
