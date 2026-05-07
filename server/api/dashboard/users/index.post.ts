import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { createUser } from '#server/services/users/userService'
import { validateDashboardUserCreateBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const input = await readValidatedBody(event, validateDashboardUserCreateBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { user: await createUser(useDb(event), actor, input) }
})
