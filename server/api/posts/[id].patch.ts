import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { updatePostForActor } from '#server/services/posts/postService'
import { parseSantriPostPayload } from '#server/utils/santriPostEditor'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { santriPostSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const postId = requireId(event)
  const raw = await readValidatedBody(event, zValidator(santriPostSchema))
  const payload = parseSantriPostPayload(raw)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return updatePostForActor(useDb(event), actor, postId, payload)
})
