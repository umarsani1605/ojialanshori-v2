import { deleteR2 } from '~~/server/utils/r2Storage'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { removeProfileAvatar } from '#server/services/profile/profileService'
import { findProfileById } from '#server/repositories/profile/profileRepository'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const db = useDb(event)
  const existing = await findProfileById(db, actor.id)
  const oldPath = existing?.avatar

  if (oldPath?.startsWith('/images/')) {
    try { await deleteR2(event, oldPath.replace(/^\/images\//, '')) } catch {}
  }

  await removeProfileAvatar(db, actor.id)

  await setUserSession(event, {
    user: { id: actor.id, fullname: actor.fullname, email: actor.email, role: actor.role, avatar: null },
  })

  return { success: true }
})
