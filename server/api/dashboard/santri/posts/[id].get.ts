import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
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
      where: and(eq(schema.posts.id, postId), eq(schema.posts.authorId, currentUser.id)),
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
      },
      with: {
        reviewer: { columns: { id: true, name: true } },
      },
    }),
    db
      .select({ name: schema.tags.name })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .innerJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
      .where(and(eq(schema.postTags.postId, postId), eq(schema.posts.authorId, currentUser.id))),
  ])

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  return {
    data: {
      ...post,
      tags: tagRows.map(tag => tag.name),
    },
  }
})
