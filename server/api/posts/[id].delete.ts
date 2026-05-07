import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { deletePostForActor } from '#server/services/posts/postService'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return deletePostForActor(useDb(event), actor, postId)
})
