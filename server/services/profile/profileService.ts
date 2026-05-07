import { and, eq, ne, or } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import {
  findProfileById,
  findUserCredentials,
  updateProfile,
  type Database,
} from '#server/repositories/profile/profileRepository'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ProfileUpdateInput = {
  name?: string
  username?: string
  email?: string
  phone?: string | null
  university?: string | null
  faculty?: string | null
  major?: string | null
  yearEnrolled?: number | null
}

export async function getOwnProfile(db: Database, userId: number) {
  const profile = await findProfileById(db, userId)
  if (!profile) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })
  return { user: profile }
}

export async function updateOwnProfile(
  db: Database,
  userId: number,
  body: ProfileUpdateInput,
) {
  const updates: Partial<typeof schema.users.$inferInsert> = {}

  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, message: 'Nama tidak boleh kosong.' })
    updates.name = name
  }
  if (body.username !== undefined) {
    const username = body.username.trim()
    if (!username) throw createError({ statusCode: 400, message: 'Username tidak boleh kosong.' })
    updates.username = username
  }
  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) {
      throw createError({ statusCode: 400, message: 'Format email tidak valid.' })
    }
    updates.email = email
  }
  if ('phone' in body) updates.phone = body.phone ?? null
  if ('university' in body) updates.university = body.university ?? null
  if ('faculty' in body) updates.faculty = body.faculty ?? null
  if ('major' in body) updates.major = body.major ?? null
  if ('yearEnrolled' in body) {
    const yr = body.yearEnrolled
    if (yr !== null && yr !== undefined && (yr < 1901 || yr > 2155)) {
      throw createError({ statusCode: 400, message: 'Tahun angkatan tidak valid.' })
    }
    updates.yearEnrolled = yr ?? null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada perubahan untuk disimpan.' })
  }

  if (updates.email || updates.username) {
    const duplicates = [
      updates.email ? eq(schema.users.email, updates.email) : undefined,
      updates.username ? eq(schema.users.username, updates.username) : undefined,
    ].filter((c): c is NonNullable<typeof c> => !!c)

    const orCondition = duplicates.length > 1 ? or(...duplicates) : duplicates[0]!
    const duplicate = await db.query.users.findFirst({
      where: and(ne(schema.users.id, userId), orCondition),
    })

    if (duplicate) {
      if (updates.email && duplicate.email === updates.email) {
        throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
      }
      throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
    }
  }

  await updateProfile(db, userId, updates)

  const updated = await findProfileById(db, userId)
  return { user: updated }
}

export async function updateOwnPassword(
  db: Database,
  userId: number,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
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

  const credentials = await findUserCredentials(db, userId)
  if (!credentials) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const valid = await verifyUserPassword(oldPassword, credentials.passwordHash, credentials.passwordType)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Password lama tidak sesuai.' })
  }

  const newHash = await hashUserPassword(newPassword)
  await updateProfile(db, userId, { passwordHash: newHash, passwordType: 'bcrypt' })

  return { success: true }
}

export async function setProfileAvatar(db: Database, userId: number, avatarPath: string) {
  await updateProfile(db, userId, { avatar: avatarPath })
  return findProfileById(db, userId)
}

export async function removeProfileAvatar(db: Database, userId: number) {
  await updateProfile(db, userId, { avatar: null })
  return { success: true }
}
