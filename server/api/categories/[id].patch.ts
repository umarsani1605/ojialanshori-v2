import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { upsertCategorySchema } from '~~/shared/schemas'
import { patchCategory } from '#server/services/categories/categoryService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const id = requireId(event)
  const body = await readValidatedBody(event, zValidator(upsertCategorySchema))
  return { data: await patchCategory(useDb(event), id, body) }
})
