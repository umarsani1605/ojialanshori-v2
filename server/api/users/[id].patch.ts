import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { patchUser } from '#server/services/users/userService'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { updateUserSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const userId = requireId(event)
  const updates = await readValidatedBody(event, zValidator(updateUserSchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { user: await patchUser(useDb(event), actor, userId, updates) }
})
