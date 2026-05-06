import { eq } from 'drizzle-orm'
import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  const body = await readBody<{
    oldPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>(event)

  const { oldPassword, newPassword, confirmPassword } = body

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw createError({ statusCode: 400, message: 'Semua field password wajib diisi.' })
  }
  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Password baru minimal 8 karakter.' })
  }
  if (newPassword !== confirmPassword) {
    throw createError({ statusCode: 400, message: 'Konfirmasi password tidak cocok.' })
  }
  if (newPassword === oldPassword) {
    throw createError({ statusCode: 400, message: 'Password baru harus berbeda dari password lama.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, currentUser.id) })
  if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const valid = await verifyUserPassword(oldPassword, user.passwordHash, user.passwordType)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Password lama tidak sesuai.' })
  }

  const newHash = await hashUserPassword(newPassword)
  await db.update(schema.users)
    .set({ passwordHash: newHash, passwordType: 'bcrypt' })
    .where(eq(schema.users.id, currentUser.id))

  return { success: true }
})
