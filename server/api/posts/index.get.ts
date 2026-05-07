import type { PostStatus } from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { listPostsForActor } from '#server/services/posts/postService'
import { validateAdminPostsQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const query = await getValidatedQuery(event, validateAdminPostsQuery)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return listPostsForActor(useDb(event), actor, query.status as PostStatus | undefined)
})
