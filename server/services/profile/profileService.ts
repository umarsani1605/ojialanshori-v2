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
  fullname?: string
  nickname?: string | null
  bio?: string | null
  email?: string
  phone?: string | null
  university?: string | null
  faculty?: string | null
  major?: string | null
  yearEnrolled?: number | null
  yearStudy?: number | null
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

  if (body.fullname !== undefined) {
    const fullname = body.fullname.trim()
    if (!fullname) throw createError({ statusCode: 400, message: 'Nama tidak boleh kosong.' })
    updates.fullname = fullname
  }
  if ('nickname' in body) updates.nickname = body.nickname ?? null
  if ('bio' in body) updates.bio = body.bio ?? null
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
      throw createError({ statusCode: 400, message: 'Tahun angkatan masuk tidak valid.' })
    }
    updates.yearEnrolled = yr ?? null
  }
  if ('yearStudy' in body) {
    const yr = body.yearStudy
    if (yr !== null && yr !== undefined && (yr < 1901 || yr > 2155)) {
      throw createError({ statusCode: 400, message: 'Tahun angkatan kuliah tidak valid.' })
    }
    updates.yearStudy = yr ?? null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada perubahan untuk disimpan.' })
  }

  if (updates.email) {
    const duplicate = await db.query.users.findFirst({
      where: and(ne(schema.users.id, userId), eq(schema.users.email, updates.email)),
    })

    if (duplicate) {
      throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
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

  const valid = await verifyUserPassword(oldPassword, credentials.password, credentials.passwordType)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Password lama tidak sesuai.' })
  }

  const newHash = await hashUserPassword(newPassword)
  await updateProfile(db, userId, { password: newHash, passwordType: 'bcrypt' })

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
