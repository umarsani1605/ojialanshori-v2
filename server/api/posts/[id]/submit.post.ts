import { isMysqlConfigured, useDb } from '#server/utils/db'
import { emailService, fireEmail } from '#server/utils/email'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { submitPostForReview } from '#server/services/posts/postService'
import { parseSantriPostPayload } from '#server/utils/santriPostEditor'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { santriPostSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, ['santri'])
  const postId = requireId(event)
  const raw = await readValidatedBody(event, zValidator(santriPostSchema))
  const payload = parseSantriPostPayload(raw)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await submitPostForReview(useDb(event), actor, postId, payload)

  fireEmail(
    event,
    emailService.sendPostSubmitted(event, {
      to: actor.email,
      authorName: actor.fullname,
      postTitle: payload.title,
    }),
    'sendPostSubmitted',
  )

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
