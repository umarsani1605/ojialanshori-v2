import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminBannerBody } from '#server/utils/validation'
import { createBanner } from '#server/services/banners/bannerService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, validateAdminBannerBody)
  return { data: await createBanner(useDb(event), body) }
})
