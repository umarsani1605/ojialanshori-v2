import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { upsertCategorySchema } from '~~/shared/schemas'
import { createCategory } from '#server/services/categories/categoryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, zValidator(upsertCategorySchema))
  return { data: await createCategory(useDb(event), body) }
})
