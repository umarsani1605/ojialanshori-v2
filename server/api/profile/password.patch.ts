import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updateOwnPassword } from '#server/services/profile/profileService'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const { oldPassword, newPassword, confirmPassword } = await readBody<{
    oldPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return updateOwnPassword(useDb(event), actor.id, oldPassword ?? '', newPassword ?? '', confirmPassword ?? '')
})
