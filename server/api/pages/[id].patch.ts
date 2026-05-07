import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateAdminPageBody } from '#server/utils/validation'
import { patchPage } from '#server/services/pages/pageService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminPageBody)
  return { data: await patchPage(useDb(event), id, body) }
})
