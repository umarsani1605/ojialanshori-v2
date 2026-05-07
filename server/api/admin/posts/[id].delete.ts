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
    columns: { id: true },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  await db.delete(schema.posts).where(eq(schema.posts.id, postId))

  return { success: true }
})
