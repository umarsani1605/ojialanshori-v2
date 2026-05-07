import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { publishPostForActor } from '#server/services/posts/postService'
import { validateRouteIdParams, validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return publishPostForActor(useDb(event), actor, postId, payload)
})
