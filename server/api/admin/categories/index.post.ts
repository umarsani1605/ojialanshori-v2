import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminCategoryBody } from '#server/utils/validation'
import { createCategory } from '#server/services/categories/categoryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, validateAdminCategoryBody)
  return { data: await createCategory(useDb(event), body) }
})
