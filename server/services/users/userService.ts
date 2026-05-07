import type { Role } from '#server/db/schema'
import { canManageUsers } from '#server/policies/users'
import {
  findUserById,
  findUserByEmailOrUsername,
  insertUser,
  listUsers,
  updateUser,
  type Database,
} from '#server/repositories/users/userRepository'

type Actor = { id: number; role: Role }

export async function listUsersForAdmin(db: Database, actor: Actor) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return listUsers(db)
}

export async function createUser(
  db: Database,
  actor: Actor,
  input: {
    name: string
    username: string
    email: string
    role: Role
    password: string
  },
) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const existing = await findUserByEmailOrUsername(db, input.email, input.username)
  if (existing) {
    if (existing.email === input.email) {
      throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
    }
    throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
  }

  const passwordHash = await hashUserPassword(input.password)
  const newId = await insertUser(db, {
    name: input.name,
    username: input.username,
    email: input.email,
    passwordHash,
    passwordType: 'bcrypt',
    role: input.role,
    avatar: null,
    isActive: true,
  })

  return findUserById(db, newId)
}

export async function patchUser(
  db: Database,
  actor: Actor,
  userId: number,
  updates: {
    name?: string
    username?: string
    email?: string
    role?: Role
    isActive?: boolean
  },
) {
  if (!canManageUsers(actor.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const user = await findUserById(db, userId)
  if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

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

  const passwordHash = await hashUserPassword(newPassword)
  await updateUser(db, userId, { passwordHash, passwordType: 'bcrypt' })

  return { success: true }
}
