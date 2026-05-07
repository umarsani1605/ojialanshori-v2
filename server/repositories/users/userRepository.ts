import { and, desc, eq, like, or } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'
import type { Role } from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

type UserFilters = {
  role?: Role
  status?: 'active' | 'inactive'
  search?: string
}

export async function listUsers(db: Database, filters: UserFilters = {}) {
  const conditions = []

  if (filters.role) conditions.push(eq(schema.users.role, filters.role))
  if (filters.status === 'active') conditions.push(eq(schema.users.isActive, true))
  if (filters.status === 'inactive') conditions.push(eq(schema.users.isActive, false))
  if (filters.search) {
    const pattern = `%${filters.search}%`
    const searchCondition = or(
      like(schema.users.name, pattern),
      like(schema.users.email, pattern),
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
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
}

export async function findUserById(db: Database, userId: number) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { passwordHash: false, passwordType: false },
  })
}

export async function findUserByEmailOrUsername(
  db: Database,
  email: string,
  username: string,
) {
  return db.query.users.findFirst({
    where: or(eq(schema.users.email, email), eq(schema.users.username, username)),
  })
}

export async function insertUser(
  db: Database,
  values: typeof schema.users.$inferInsert,
): Promise<number> {
  const result = await db.insert(schema.users).values(values)
  return result[0].insertId
}

export async function updateUser(
  db: Database,
  userId: number,
  values: Partial<typeof schema.users.$inferInsert>,
): Promise<void> {
  await db.update(schema.users).set(values).where(eq(schema.users.id, userId))
}
