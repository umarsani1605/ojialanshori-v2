import { deleteR2, getR2KeyFromPath } from '~~/server/utils/r2Storage'

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
  const oldKey = getR2KeyFromPath(event, existing?.avatar)
  if (oldKey) {
    try { await deleteR2(event, oldKey) } catch {}
  }

  await removeProfileAvatar(db, actor.id)

  await setUserSession(event, {
    user: { id: actor.id, fullname: actor.fullname, nickname: actor.nickname ?? null, email: actor.email, role: actor.role, avatar: null },
  })

  return { success: true }
})
