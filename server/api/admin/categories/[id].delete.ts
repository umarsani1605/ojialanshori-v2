import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'
import { removeCategory } from '#server/services/categories/categoryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  await removeCategory(useDb(event), id)
  return { success: true }
})
