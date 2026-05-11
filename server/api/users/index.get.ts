import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { adminUsersQuerySchema } from '~~/shared/schemas'
import { listUsersForAdmin } from '#server/services/users/userService'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const filters = await getValidatedQuery(event, zValidator(adminUsersQuerySchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { data: await listUsersForAdmin(useDb(event), actor, filters) }
})
