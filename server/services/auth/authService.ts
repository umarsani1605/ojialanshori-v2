import {
  findUserForAuth,
  updateUserPassword,
  type Database,
} from '#server/repositories/auth/authRepository'
import {
  findUserById,
  findUserByEmail,
  insertUser,
} from '#server/repositories/users/userRepository'
import { hashUserPassword, verifyUserPassword } from '#server/utils/password'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SEC = 15 * 60

type LoginInput = {
  identifier: string
  password: string
  remember: boolean
}

type RegisterInput = {
  fullname: string
  email: string
  password: string
}

type RateLimitRecord = { count: number; firstAt: number }

const rateLimitStore = new Map<string, RateLimitRecord>()

function getRateLimit(key: string): RateLimitRecord | null {
  const record = rateLimitStore.get(key)
  if (!record) return null
  if (Date.now() - record.firstAt >= RATE_LIMIT_WINDOW_SEC * 1000) {
    rateLimitStore.delete(key)
    return null
  }
  return record
}

function recordFailedLoginAttempt(key: string): void {
  const now = Date.now()
  const current = rateLimitStore.get(key)
  if (!current || Date.now() - current.firstAt >= RATE_LIMIT_WINDOW_SEC * 1000) {
    rateLimitStore.set(key, { count: 1, firstAt: now })
  }
  else {
    rateLimitStore.set(key, { count: current.count + 1, firstAt: current.firstAt })
  }
}

export async function verifyLogin(
  db: Database,
  input: LoginInput,
  ip: string,
) {
  const rateLimitKey = `ratelimit:login:${ip}`

  const attempts = getRateLimit(rateLimitKey)
  if (
    attempts &&
    attempts.count >= RATE_LIMIT_MAX &&
    Date.now() - attempts.firstAt < RATE_LIMIT_WINDOW_SEC * 1000
  ) {
    throw createError({
      statusCode: 429,
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    })
  }

  const user = await findUserForAuth(db, input.identifier)

  if (!user) {
    recordFailedLoginAttempt(rateLimitKey)
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })
  }

  const isValid = await verifyUserPassword(input.password, user.password, user.passwordType)
  if (!isValid) {
    recordFailedLoginAttempt(rateLimitKey)
    throw createError({ statusCode: 401, message: 'Email atau password salah.' })
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, message: 'Akun tidak aktif.' })
  }

  if (user.passwordType === 'phpass') {
    const newHash = await hashUserPassword(input.password)
    updateUserPassword(db, user.id, newHash).catch(() => {})
  }

  rateLimitStore.delete(rateLimitKey)

  return {
    user: {
      id: user.id,
      fullname: user.fullname,
      nickname: user.nickname ?? null,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? null,
    },
    maxAge: input.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
  }
}

export async function registerSantri(
  db: Database,
  input: RegisterInput,
) {
  const existing = await findUserByEmail(db, input.email)
  if (existing) {
    throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
  }

  const hashedPassword = await hashUserPassword(input.password)

  const newUserId = await insertUser(db, {
    fullname: input.fullname,
    email: input.email,
    password: hashedPassword,
    passwordType: 'bcrypt',
    role: 'santri',
    avatar: null,
    nickname: null,
    bio: null,
    phone: null,
    university: null,
    faculty: null,
    major: null,
    yearEnrolled: null,
    yearStudy: null,
    isActive: false,
  })

  return findUserById(db, newUserId)
}
