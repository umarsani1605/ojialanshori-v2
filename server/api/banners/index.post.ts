import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { upsertBannerSchema } from '~~/shared/schemas'
import { createBanner } from '#server/services/banners/bannerService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, zValidator(upsertBannerSchema))
  const data = await createBanner(useDb(event), body)
  await markMutated(PublicCacheScopes.banner)
  return { data }
})
