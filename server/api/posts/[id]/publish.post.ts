import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { publishPostForActor } from '#server/services/posts/postService'
import { parseSantriPostPayload } from '#server/utils/santriPostEditor'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { santriPostSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireReviewer(event)
  const postId = requireId(event)
  const raw = await readValidatedBody(event, zValidator(santriPostSchema))
  const payload = parseSantriPostPayload(raw)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await publishPostForActor(useDb(event), actor, postId, payload)

  const sessionId = getHeader(event, 'x-posthog-session-id')
  const distinctId = getHeader(event, 'x-posthog-distinct-id')
  useServerPostHog().capture({
    distinctId: distinctId ?? actor.email ?? 'anonymous',
    event: 'post_published',
    properties: {
      $session_id: sessionId,
      post_id: postId,
      actor_role: actor.role,
    },
  })

  return result
})
