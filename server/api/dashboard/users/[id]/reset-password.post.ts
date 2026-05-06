import { eq } from 'drizzle-orm'
import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireSuperadmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireSuperadmin(event)

  const { id } = await getValidatedRouterParams(event, validateRouteIdParams)
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID user tidak valid.' })
  }

  if (id === currentUser.id) {
    throw createError({ statusCode: 403, message: 'Tidak bisa reset password sendiri. Gunakan halaman Profil.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const target = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!target) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const newPassword = generatePassword(12)
  const passwordHash = await hashUserPassword(newPassword)

  await db.update(schema.users)
    .set({ passwordHash, passwordType: 'bcrypt' })
    .where(eq(schema.users.id, id))

  await sendEmail(event, {
    to: target.email,
    toName: target.name,
    subject: 'Reset Password Akun Omah Ngaji Al-Anshori',
    textContent: `Halo ${target.name},

Password akun kamu telah direset oleh administrator.
Password baru kamu: ${newPassword}

Silakan login dengan password baru dan segera ganti password di halaman Profil.

Omah Ngaji Al-Anshori`,
    htmlContent: `<p>Halo <b>${target.name}</b>,</p>
<p>Password akun kamu telah direset oleh administrator.<br>
Password baru kamu: <code>${newPassword}</code></p>
<p>Silakan login dengan password baru dan segera ganti password di halaman Profil.</p>
<p>Omah Ngaji Al-Anshori</p>`,
  })

  return { success: true, email: target.email }
})
