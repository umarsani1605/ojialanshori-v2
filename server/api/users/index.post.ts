import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { createUser } from '#server/services/users/userService'
import { zValidator } from '#server/utils/zod-validator'
import { createUserSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const input = await readValidatedBody(event, zValidator(createUserSchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { user: await createUser(useDb(event), actor, input) }
})
