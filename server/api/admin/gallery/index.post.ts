import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminGalleryBody } from '#server/utils/validation'
import { createGalleryItem } from '#server/services/gallery/galleryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, validateAdminGalleryBody)
  return { data: await createGalleryItem(useDb(event), body) }
})
