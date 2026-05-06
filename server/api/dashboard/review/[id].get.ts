import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const [post, tagRows] = await Promise.all([
    db.query.posts.findFirst({
      where: and(
        eq(schema.posts.id, postId),
        eq(schema.posts.status, 'pending_review'),
      ),
      columns: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        status: true,
        updatedAt: true,
      },
      with: {
        author: { columns: { id: true, name: true, email: true } },
        category: { columns: { id: true, name: true, type: true } },
      },
    }),
    db.select({ name: schema.tags.name })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(eq(schema.postTags.postId, postId)),
  ])

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan atau bukan dalam status pending review.' })
  }

  return {
    data: {
      ...post,
      tags: tagRows.map(t => t.name),
    },
  }
})
