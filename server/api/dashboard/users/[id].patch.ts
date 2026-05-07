import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { patchUser } from '#server/services/users/userService'
import { validateDashboardUserUpdateBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const { id: userId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const updates = await readValidatedBody(event, validateDashboardUserUpdateBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { user: await patchUser(useDb(event), actor, userId, updates) }
})
