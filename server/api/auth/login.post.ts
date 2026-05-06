import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateLoginBody } from '#server/utils/validation'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SEC = 15 * 60 // 15 menit

export default defineEventHandler(async (event) => {
  const { identifier, password, remember } = await readValidatedBody(event, validateLoginBody)

  // Rate limiting via Cloudflare KV
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) {
    throw createError({ statusCode: 400, message: 'Tidak dapat mengidentifikasi alamat IP.' })
  }
  const rateLimitKey = `ratelimit:login:${ip}`

  const attempts = await kv.getItem<{ count: number; firstAt: number }>(rateLimitKey)
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

  const recordFailedAttempt = async () => {
    const now = Date.now()
    const current = await kv.getItem<{ count: number; firstAt: number }>(rateLimitKey)
    if (!current || Date.now() - current.firstAt >= RATE_LIMIT_WINDOW_SEC * 1000) {
      await kv.setItem(rateLimitKey, { count: 1, firstAt: now }, { ttl: RATE_LIMIT_WINDOW_SEC })
    }
    else {
      const remainingTtl = Math.ceil(RATE_LIMIT_WINDOW_SEC - (Date.now() - current.firstAt) / 1000)
      await kv.setItem(
        rateLimitKey,
        { count: current.count + 1, firstAt: current.firstAt },
        { ttl: remainingTtl > 0 ? remainingTtl : 1 },
      )
    }
  }

  // Query user dari DB
  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  // Determine column to query: email contains '@', otherwise treat as username
  const isEmail = identifier.includes('@')
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      username: schema.users.username,
      passwordHash: schema.users.passwordHash,
      passwordType: schema.users.passwordType,
      role: schema.users.role,
      avatar: schema.users.avatar,
      isActive: schema.users.isActive,
    })
    .from(schema.users)
    .where(isEmail
      ? eq(schema.users.email, identifier)
      : eq(schema.users.username, identifier))
    .limit(1)

  if (!user) {
    await recordFailedAttempt()
    throw createError({ statusCode: 401, message: 'Username atau password salah.' })
  }

  // Verify password before checking isActive so rate limiting applies to all attempts
  const isValid = await verifyUserPassword(password, user.passwordHash, user.passwordType)
  if (!isValid) {
    await recordFailedAttempt()
    throw createError({ statusCode: 401, message: 'Username atau password salah.' })
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, message: 'Akun tidak aktif.' })
  }

  // Progressive migration: phpass → bcrypt (fire-and-forget, tidak menambah latency)
  if (user.passwordType === 'phpass') {
    const userId = user.id
    const migrateTask = (async () => {
      const newHash = await hashUserPassword(password)
      await useDb(event)
        .update(schema.users)
        .set({ passwordHash: newHash, passwordType: 'bcrypt' })
        .where(eq(schema.users.id, userId))
    })()

    event.waitUntil?.(migrateTask)
    if (!event.waitUntil) {
      migrateTask.catch(() => {})
    }
  }

  // Hapus rate limit setelah login berhasil
  await kv.removeItem(rateLimitKey)

  // Set session (remember: 30 hari, default: 1 hari)
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  await setUserSession(
    event,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar ?? null,
      },
    },
    { maxAge },
  )

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? null,
    },
  }
})
