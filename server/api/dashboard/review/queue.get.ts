import { desc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  requireReviewer(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'pending_review'),
    orderBy: [desc(schema.posts.updatedAt)],
    columns: { id: true, title: true, slug: true, updatedAt: true },
    with: {
      author: { columns: { id: true, name: true } },
      category: { columns: { id: true, name: true, type: true } },
    },
  })

  return { data: posts }
})
