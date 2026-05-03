import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, eq, ne, or } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Role } from '~~/server/db/schema'

const VALID_ROLES: Role[] = ['superadmin', 'pengurus', 'reviewer', 'santri']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const currentUser = requireSuperadmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID user tidak valid.' })
  }

  if (id === currentUser.id) {
    throw createError({ statusCode: 403, message: 'Superadmin tidak bisa mengedit dirinya sendiri di sini. Gunakan halaman Profil.' })
  }

  const body = await readBody<{
    name?: string
    username?: string
    email?: string
    role?: Role
    isActive?: boolean
  }>(event)

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
    if (!EMAIL_REGEX.test(email)) throw createError({ statusCode: 400, message: 'Format email tidak valid.' })
    updates.email = email
  }
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      throw createError({ statusCode: 400, message: 'Role tidak valid.' })
    }
    updates.role = body.role
  }
  if (body.isActive !== undefined) {
    updates.isActive = Boolean(body.isActive)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada perubahan untuk disimpan.' })
  }

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const target = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
    if (!target) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

    if (updates.email || updates.username) {
      const duplicates = [
        updates.email ? eq(schema.users.email, updates.email) : undefined,
        updates.username ? eq(schema.users.username, updates.username) : undefined,
      ].filter(Boolean) as NonNullable<ReturnType<typeof eq>>[]

      const orCondition = duplicates.length > 1 ? or(...duplicates) : duplicates[0]
      const duplicate = orCondition
        ? await db.query.users.findFirst({
          where: and(ne(schema.users.id, id), orCondition),
        })
        : null

      if (duplicate) {
        if (updates.email && duplicate.email === updates.email) {
          throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
        }
        throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
      }
    }

    await db.update(schema.users).set(updates).where(eq(schema.users.id, id))

    const updated = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: { passwordHash: false, passwordType: false },
    })

    return { user: updated }
  }
  finally {
    await connection.end()
  }
})
