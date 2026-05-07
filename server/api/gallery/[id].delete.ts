import { blob } from '@nuxthub/blob'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'
import { removeGalleryItem } from '#server/services/gallery/galleryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  const imagePath = await removeGalleryItem(useDb(event), id)

  if (imagePath?.startsWith('/images/')) {
    try { await blob.delete(imagePath.replace(/^\/images\//, '')) } catch {}
  }

  return { success: true }
})
