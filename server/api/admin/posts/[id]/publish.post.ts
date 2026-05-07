import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams, validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const user = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: { id: true, authorId: true },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  if (post.authorId !== user.id) {
    throw createError({ statusCode: 403, message: 'Kamu hanya bisa mempublish post milikmu sendiri.' })
  }

  const now = new Date()

  await db.update(schema.posts)
    .set({
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      categoryId: payload.categoryId,
      featuredImage: payload.featuredImage,
      tags: payload.tags,
      status: 'published',
      publishedAt: now,
      reviewedBy: user.id,
      reviewNote: null,
    })
    .where(eq(schema.posts.id, postId))

  return { id: postId, status: 'published' as const, publishedAt: now }
})
