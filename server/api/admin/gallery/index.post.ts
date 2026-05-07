import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminGalleryBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const body = await readValidatedBody(event, validateAdminGalleryBody)
  const db = useDb(event)

  const [result] = await db.insert(schema.gallery).values({
    title: body.title,
    imagePath: body.imagePath,
    album: body.album,
    order: body.order,
  })

  const inserted = await db.query.gallery.findFirst({
    where: (g, { eq }) => eq(g.id, result.insertId),
  })

  return { data: inserted }
})
