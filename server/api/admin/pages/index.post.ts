import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminPageBody } from '#server/utils/validation'
import { createPage } from '#server/services/pages/pageService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, validateAdminPageBody)
  return { data: await createPage(useDb(event), body) }
})
