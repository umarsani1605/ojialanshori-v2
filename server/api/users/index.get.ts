import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { listUsersForAdmin } from '#server/services/users/userService'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { data: await listUsersForAdmin(useDb(event), actor) }
})
