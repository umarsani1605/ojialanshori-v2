import { isMysqlConfigured, useDb } from '#server/utils/db'
import { emailService } from '#server/utils/email'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { resetUserPassword } from '#server/services/users/userService'
import { findUserById } from '#server/repositories/users/userRepository'
import { requireId } from '#server/utils/zod-validator'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const userId = requireId(event)

  if (userId === actor.id) {
    throw createError({ statusCode: 403, message: 'Tidak bisa reset password sendiri. Gunakan halaman Profil.' })
  }

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const db = useDb(event)
  const target = await findUserById(db, userId)
  if (!target) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const newPassword = generatePassword(12)
  await resetUserPassword(db, actor, userId, newPassword)

  await emailService.sendPasswordReset(event, {
    to: target.email,
    name: target.fullname,
    newPassword,
  })

  return { success: true, email: target.email }
})
