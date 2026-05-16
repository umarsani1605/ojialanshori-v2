import { deleteR2, getR2KeyFromPath } from '~~/server/utils/r2Storage'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { findUserById } from '#server/repositories/users/userRepository'
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

  const db = useDb(event)
  const previousUser = await findUserById(db, userId)
  const user = await patchUser(db, actor, userId, updates)

  const previousAvatar = previousUser?.avatar
  const nextAvatar = user?.avatar ?? null

  if (previousAvatar && previousAvatar !== nextAvatar) {
    const key = getR2KeyFromPath(event, previousAvatar)
    if (key) {
      try { await deleteR2(event, key) } catch {}
    }
  }

  return { user }
})
