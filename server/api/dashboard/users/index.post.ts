import { eq, or } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireSuperadmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateDashboardUserCreateBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireSuperadmin(event)

  const { name, username, email, role, password } = await readValidatedBody(event, validateDashboardUserCreateBody)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const existing = await db.query.users.findFirst({
    where: or(eq(schema.users.email, email), eq(schema.users.username, username)),
  })
  if (existing) {
    if (existing.email === email) {
      throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
    }
    throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
  }

  const passwordHash = await hashUserPassword(password)

  const result = await db.insert(schema.users).values({
    name,
    username,
    email,
    passwordHash,
    passwordType: 'bcrypt',
    role,
    avatar: null,
    isActive: true,
  })

  const newId = result[0].insertId
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, newId),
    columns: { passwordHash: false, passwordType: false },
  })

  return { user }
})
