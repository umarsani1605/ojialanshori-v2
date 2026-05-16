import { deleteR2, getR2KeyFromPath } from '~~/server/utils/r2Storage'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireId } from '#server/utils/zod-validator'
import { removeGalleryItem } from '#server/services/gallery/galleryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const id = requireId(event)
  const imagePath = await removeGalleryItem(useDb(event), id)

  const key = getR2KeyFromPath(event, imagePath)
  if (key) {
    try { await deleteR2(event, key) } catch {}
  }

  await markMutated(PublicCacheScopes.gallery)

  return { success: true }
})
