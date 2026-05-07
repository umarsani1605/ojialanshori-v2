import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { listGalleryForAdmin } from '#server/services/gallery/galleryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { data: await listGalleryForAdmin(useDb(event)) }
})
