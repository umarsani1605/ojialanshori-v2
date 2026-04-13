import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq, or } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SEC = 15 * 60 // 15 menit

export default defineEventHandler(async (event) => {
  const { identifier, password, remember } = await readBody<{
    identifier: string
    password: string
    remember?: boolean
  }>(event)

  if (!identifier || !password) {
    throw createError({ statusCode: 400, message: 'Identifier dan password wajib diisi.' })
  }

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
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const user = await db.query.users.findFirst({
      where: or(
        eq(schema.users.username, identifier),
        eq(schema.users.email, identifier),
      ),
    })

    if (!user) {
      await recordFailedAttempt()
      throw createError({ statusCode: 401, message: 'Username atau password salah.' })
    }

    if (!user.isActive) {
      throw createError({ statusCode: 403, message: 'Akun tidak aktif.' })
    }

    const isValid = await verifyPassword(password, user.passwordHash, user.passwordType)
    if (!isValid) {
      await recordFailedAttempt()
      throw createError({ statusCode: 401, message: 'Username atau password salah.' })
    }

    // Progressive migration: phpass → bcrypt
    if (user.passwordType === 'phpass') {
      const newHash = await hashPassword(password)
      await db
        .update(schema.users)
        .set({ passwordHash: newHash, passwordType: 'bcrypt' })
        .where(eq(schema.users.id, user.id))
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
          role: user.role,
          avatarPath: user.avatarPath ?? null,
        },
      },
      { maxAge },
    )

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatarPath: user.avatarPath ?? null,
      },
    }
  }
  finally {
    await connection.end()
  }
})
