import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updateOwnProfile } from '#server/services/profile/profileService'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { updateProfileSchema } from '#server/schemas'

export default defineValidatedHandler(updateProfileSchema, async (event, body) => {
  const actor = requireAuth(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await updateOwnProfile(useDb(event), actor.id, body)

  if (result.user) {
    await setUserSession(event, {
      user: {
        id: result.user.id,
        fullname: result.user.fullname,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar ?? null,
      },
    })
  }

  return result
})
