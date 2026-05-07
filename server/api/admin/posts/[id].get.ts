import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      featuredImage: true,
      categoryId: true,
      status: true,
      reviewNote: true,
      tags: true,
      updatedAt: true,
      publishedAt: true,
    },
    with: {
      author: { columns: { id: true, name: true, email: true } },
      category: { columns: { id: true, name: true, type: true } },
      reviewer: { columns: { id: true, name: true } },
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  return { data: post }
})
