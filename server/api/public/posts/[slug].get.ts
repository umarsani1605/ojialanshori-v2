import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateSlugParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, validateSlugParams)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const rows = await db.select({
    id: schema.posts.id,
    title: schema.posts.title,
    slug: schema.posts.slug,
    content: schema.posts.content,
    excerpt: schema.posts.excerpt,
    featuredImage: schema.posts.featuredImage,
    publishedAt: schema.posts.publishedAt,
    createdAt: schema.posts.createdAt,
    categorySlug: schema.categories.slug,
    categoryName: schema.categories.name,
    categoryType: schema.categories.type,
    authorName: schema.users.name,
  })
    .from(schema.posts)
    .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .where(and(
      eq(schema.posts.slug, slug),
      eq(schema.posts.status, 'published'),
    ))
    .limit(1)

  const post = rows[0]
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  return { post }
})
