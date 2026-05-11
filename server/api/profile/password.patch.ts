import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updateOwnPassword } from '#server/services/profile/profileService'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { changePasswordSchema } from '#server/schemas'

export default defineValidatedHandler(changePasswordSchema, async (event, body) => {
  const actor = requireAuth(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return updateOwnPassword(useDb(event), actor.id, body.oldPassword, body.newPassword, body.confirmPassword)
})
