import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '../../db/schema'

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
    // Determine column to query: email contains '@', otherwise treat as username
    const isEmail = identifier.includes('@')
    const user = await db.query.users.findFirst({
      where: isEmail
        ? eq(schema.users.email, identifier)
        : eq(schema.users.username, identifier),
    })

    if (!user) {
      await recordFailedAttempt()
      throw createError({ statusCode: 401, message: 'Username atau password salah.' })
    }

    // Verify password before checking isActive so rate limiting applies to all attempts
    const isValid = await verifyPassword(password, user.passwordHash, user.passwordType)
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
        const migConn = await mysql.createConnection(mysqlUrl)
        const migDb = drizzle(migConn, { schema, casing: 'snake_case', mode: 'default' })
        try {
          const newHash = await hashPassword(password)
          await migDb
            .update(schema.users)
            .set({ passwordHash: newHash, passwordType: 'bcrypt' })
            .where(eq(schema.users.id, userId))
        }
        finally {
          await migConn.end()
        }
      })()

      // Cloudflare Workers: gunakan waitUntil agar task selesai setelah response
      const cfCtx = (event.context as { cloudflare?: { context?: { waitUntil: (p: Promise<unknown>) => void } } }).cloudflare?.context
      cfCtx ? cfCtx.waitUntil(migrateTask) : migrateTask.catch(() => {})
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
