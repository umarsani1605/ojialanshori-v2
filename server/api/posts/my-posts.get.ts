import { desc, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri', 'reviewer'])

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      status: schema.posts.status,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      categoryName: schema.categories.name,
    })
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(eq(schema.posts.authorId, currentUser.id))
    .orderBy(desc(schema.posts.createdAt))
    .limit(4)

  return { data: rows }
})
