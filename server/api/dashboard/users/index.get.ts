import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  requireSuperadmin(event)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const role = typeof query.role === 'string' ? query.role : undefined
  const status = typeof query.status === 'string' ? query.status : undefined // 'active' | 'inactive'
  const search = typeof query.search === 'string' ? query.search.trim() : ''

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const conditions: SQL[] = []
    if (role && ['superadmin', 'pengurus', 'reviewer', 'santri'].includes(role)) {
      conditions.push(eq(schema.users.role, role as 'superadmin' | 'pengurus' | 'reviewer' | 'santri'))
    }
    if (status === 'active') conditions.push(eq(schema.users.isActive, true))
    if (status === 'inactive') conditions.push(eq(schema.users.isActive, false))
    if (search) {
      const pattern = `%${search}%`
      const searchCondition = or(
        like(schema.users.name, pattern),
        like(schema.users.email, pattern),
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalResult] = await Promise.all([
      db.select({
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        email: schema.users.email,
        role: schema.users.role,
        avatarPath: schema.users.avatarPath,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      })
        .from(schema.users)
        .where(where)
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(schema.users).where(where),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
  finally {
    await connection.end()
  }
})
