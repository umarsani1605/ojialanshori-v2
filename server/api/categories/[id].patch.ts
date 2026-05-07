import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateAdminCategoryBody } from '#server/utils/validation'
import { patchCategory } from '#server/services/categories/categoryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateAdminCategoryBody)
  return { data: await patchCategory(useDb(event), id, body) }
})
