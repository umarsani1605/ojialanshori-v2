import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireId } from '#server/utils/zod-validator'
import { removeBanner } from '#server/services/banners/bannerService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const id = requireId(event)
  await removeBanner(useDb(event), id)
  await markMutated(PublicCacheScopes.banner)
  return { success: true }
})
