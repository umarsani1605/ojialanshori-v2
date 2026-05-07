import { asc } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const categories = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.type), asc(schema.categories.name)],
    with: {
      parent: { columns: { id: true, name: true } },
    },
  })

  return { data: categories }
})
