import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, currentUser.id),
    columns: { passwordHash: false, passwordType: false },
  })
  if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })
  return { user }
})
