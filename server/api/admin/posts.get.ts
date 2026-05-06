import { count, desc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminPostsQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const query = await getValidatedQuery(event, validateAdminPostsQuery)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)
  const offset = (query.page - 1) * query.limit
  const whereClause = query.status ? eq(schema.posts.status, query.status) : undefined

  const [posts, totalResult] = await Promise.all([
    db.query.posts.findMany({
      where: whereClause,
      orderBy: [desc(schema.posts.updatedAt)],
      limit: query.limit,
      offset,
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        publishedAt: true,
      },
      with: {
        author: { columns: { id: true, name: true } },
        category: { columns: { id: true, name: true, type: true } },
      },
    }),
    db.select({ count: count() }).from(schema.posts).where(whereClause),
  ])

  return {
    data: posts,
    total: totalResult[0]?.count ?? 0,
    page: query.page,
    limit: query.limit,
  }
})
