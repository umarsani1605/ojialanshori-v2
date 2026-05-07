import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { createPostForActor } from '#server/services/posts/postService'
import { validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return createPostForActor(useDb(event), actor, payload)
})
