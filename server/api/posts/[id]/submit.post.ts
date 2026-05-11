import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { submitPostForReview } from '#server/services/posts/postService'
import { validateRouteIdParams, validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, ['santri'])
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await submitPostForReview(useDb(event), actor, postId, payload)

  const sessionId = getHeader(event, 'x-posthog-session-id')
  const distinctId = getHeader(event, 'x-posthog-distinct-id')
  useServerPostHog().capture({
    distinctId: distinctId ?? actor.email ?? 'anonymous',
    event: 'post_submitted_for_review',
    properties: {
      $session_id: sessionId,
      post_id: postId,
    },
  })

  return result
})
