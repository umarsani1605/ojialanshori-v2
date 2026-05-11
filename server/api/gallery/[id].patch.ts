import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { updateGallerySchema } from '~~/shared/schemas'
import { patchGalleryItem } from '#server/services/gallery/galleryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const id = requireId(event)
  const body = await readValidatedBody(event, zValidator(updateGallerySchema))
  return { data: await patchGalleryItem(useDb(event), id, body) }
})
