import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq, or } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import type { Role } from '~/server/db/schema'

const VALID_ROLES: Role[] = ['superadmin', 'pengurus', 'reviewer', 'santri']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  requireSuperadmin(event)

  const body = await readBody<{
    name?: string
    username?: string
    email?: string
    role?: Role
    password?: string
  }>(event)

  const name = body.name?.trim()
  const username = body.username?.trim()
  const email = body.email?.trim().toLowerCase()
  const role = body.role
  const password = body.password

  if (!name || !username || !email || !role || !password) {
    throw createError({ statusCode: 400, message: 'Semua field wajib diisi.' })
  }
  if (!EMAIL_REGEX.test(email)) {
    throw createError({ statusCode: 400, message: 'Format email tidak valid.' })
  }
  if (!VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, message: 'Role tidak valid.' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password minimal 8 karakter.' })
  }

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const existing = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.username, username)),
    })
    if (existing) {
      if (existing.email === email) {
        throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
      }
      throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
    }

    const passwordHash = await hashPassword(password)

    const result = await db.insert(schema.users).values({
      name,
      username,
      email,
      passwordHash,
      passwordType: 'bcrypt',
      role,
      avatarPath: null,
      isActive: true,
    })

    const newId = result[0].insertId
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, newId),
      columns: { passwordHash: false, passwordType: false },
    })

    return { user }
  }
  finally {
    await connection.end()
  }
})
