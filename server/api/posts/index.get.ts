import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { listPostsForActor } from '#server/services/posts/postService'
import { zValidator } from '#server/utils/zod-validator'
import { adminPostsQuerySchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const query = await getValidatedQuery(event, zValidator(adminPostsQuerySchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return listPostsForActor(useDb(event), actor, query.status)
})
