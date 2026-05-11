import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updateOwnPassword } from '#server/services/profile/profileService'
import { zValidator } from '#server/utils/zod-validator'
import { changePasswordSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const body = await readValidatedBody(event, zValidator(changePasswordSchema))
  return updateOwnPassword(useDb(event), actor.id, body.oldPassword, body.newPassword, body.confirmPassword)
})
