import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updatePostForActor } from '#server/services/posts/postService'
import { validateRouteIdParams, validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return updatePostForActor(useDb(event), actor, postId, payload)
})
