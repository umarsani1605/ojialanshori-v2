import { sql } from 'drizzle-orm'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  await useDb(event).execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})
