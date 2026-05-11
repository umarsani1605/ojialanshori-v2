import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { createPostForActor } from '#server/services/posts/postService'
import { parseSantriPostPayload } from '#server/utils/santriPostEditor'
import { zValidator } from '#server/utils/zod-validator'
import { santriPostSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const raw = await readValidatedBody(event, zValidator(santriPostSchema))
  const payload = parseSantriPostPayload(raw)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return createPostForActor(useDb(event), actor, payload)
})
