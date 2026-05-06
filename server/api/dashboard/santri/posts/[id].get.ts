import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { getSantriOwnedPost } from '#server/utils/santriPostEditor'
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
    getSantriOwnedPost(db, postId, currentUser.id),
    db
      .select({ name: schema.tags.name })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .innerJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
      .where(and(eq(schema.postTags.postId, postId), eq(schema.posts.authorId, currentUser.id))),
  ])

  return {
    data: {
      ...post,
      tags: tagRows.map(tag => tag.name),
    },
  }
})
