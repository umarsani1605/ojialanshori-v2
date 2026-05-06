import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateDashboardUsersQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = await getValidatedQuery(event, validateDashboardUsersQuery)
  const page = query.page
  const limit = query.limit
  const offset = (page - 1) * limit

  const { role, status, search } = query

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const conditions: SQL[] = []
  if (role) {
    conditions.push(eq(schema.users.role, role))
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
      avatar: schema.users.avatar,
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
})
