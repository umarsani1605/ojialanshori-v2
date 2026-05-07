import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { getOwnProfile } from '#server/services/profile/profileService'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return getOwnProfile(useDb(event), actor.id)
})
