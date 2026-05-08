import type { Role } from '#server/db/schema'
import { canManageUsers } from '#server/policies/users'
import {
  findUserById,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameExcluding,
  insertUser,
  listUsers,
  updateUser,
  type Database,
} from '#server/repositories/users/userRepository'

type Actor = { id: number; role: Role }
type UserFilters = {
  role?: Role
  status?: 'active' | 'inactive'
  search?: string
  phone?: string
  university?: string
  yearEnrolled?: number
  yearStudy?: number
}

export async function listUsersForAdmin(db: Database, actor: Actor, filters: UserFilters = {}) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return listUsers(db, filters)
}

export async function createUser(
  db: Database,
  actor: Actor,
  input: {
    fullname: string
    nickname: string | null
    bio: string | null
    email: string
    role: Role
    password: string
    avatar: string | null
    phone: string | null
    university: string | null
    faculty: string | null
    major: string | null
    yearEnrolled: number | null
    yearStudy: number | null
    isActive: boolean
  },
) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const existing = await findUserByEmail(db, input.email)
  if (existing) {
    throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
  }

  const hashedPassword = await hashUserPassword(input.password)
  const newId = await insertUser(db, {
    fullname: input.fullname,
    nickname: input.nickname,
    bio: input.bio,
    email: input.email,
    password: hashedPassword,
    passwordType: 'bcrypt',
    role: input.role,
    avatar: input.avatar,
    phone: input.phone,
    university: input.university,
    faculty: input.faculty,
    major: input.major,
    yearEnrolled: input.yearEnrolled,
    yearStudy: input.yearStudy,
    isActive: input.isActive,
  })

  return findUserById(db, newId)
}

export async function patchUser(
  db: Database,
  actor: Actor,
  userId: number,
  updates: {
    fullname?: string
    nickname?: string | null
    bio?: string | null
    email?: string
    role?: Role
    isActive?: boolean
    avatar?: string | null
    phone?: string | null
    university?: string | null
    faculty?: string | null
    major?: string | null
    yearEnrolled?: number | null
    yearStudy?: number | null
  },
) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const user = await findUserById(db, userId)
  if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  if (updates.email) {
    const existing = await findUserByEmailExcluding(
      db,
      updates.email,
      userId,
    )

    if (existing) {
      throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
    }
  }

  await updateUser(db, userId, updates)
  return findUserById(db, userId)
}

export async function resetUserPassword(
  db: Database,
  actor: Actor,
  userId: number,
  newPassword: string,
) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const user = await findUserById(db, userId)
  if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  const hashedPassword = await hashUserPassword(newPassword)
  await updateUser(db, userId, { password: hashedPassword, passwordType: 'bcrypt' })

  return { success: true }
}
