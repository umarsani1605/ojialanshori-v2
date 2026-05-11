import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { upsertBannerSchema } from '~~/shared/schemas'
import { patchBanner } from '#server/services/banners/bannerService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const id = requireId(event)
  const body = await readValidatedBody(event, zValidator(upsertBannerSchema))
  return { data: await patchBanner(useDb(event), id, body) }
})
