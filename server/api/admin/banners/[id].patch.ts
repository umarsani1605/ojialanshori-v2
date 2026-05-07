import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateAdminBannerBody } from '#server/utils/validation'
import { patchBanner } from '#server/services/banners/bannerService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminBannerBody)
  return { data: await patchBanner(useDb(event), id, body) }
})
