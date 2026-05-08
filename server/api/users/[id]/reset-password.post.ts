import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { resetUserPassword } from '#server/services/users/userService'
import { findUserById } from '#server/repositories/users/userRepository'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)
  const { id: userId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (userId === actor.id) {
    throw createError({ statusCode: 403, message: 'Tidak bisa reset password sendiri. Gunakan halaman Profil.' })
  }

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const db = useDb(event)
  const target = await findUserById(db, userId)
  if (!target) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const newPassword = generatePassword(12)
  await resetUserPassword(db, actor, userId, newPassword)

  await sendEmail(event, {
    to: target.email,
    toName: target.fullname,
    subject: 'Reset Password Akun Omah Ngaji Al-Anshori',
    textContent: `Halo ${target.fullname},\n\nPassword akun kamu telah direset oleh administrator.\nPassword baru kamu: ${newPassword}\n\nSilakan login dengan password baru dan segera ganti password di halaman Profil.\n\nOmah Ngaji Al-Anshori`,
    htmlContent: `<p>Halo <b>${target.fullname}</b>,</p><p>Password akun kamu telah direset oleh administrator.<br>Password baru kamu: <code>${newPassword}</code></p><p>Silakan login dengan password baru dan segera ganti password di halaman Profil.</p><p>Omah Ngaji Al-Anshori</p>`,
  })

  return { success: true, email: target.email }
})
