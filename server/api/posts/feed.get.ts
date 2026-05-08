import { and, desc, eq, ne } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      featuredImage: schema.posts.featuredImage,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
      authorName: schema.users.fullname,
    })
    .from(schema.posts)
    .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .where(and(
      eq(schema.posts.status, 'published'),
      ne(schema.categories.type, 'berita'),
    ))
    .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
    .limit(4)

  return { data: rows }
})
