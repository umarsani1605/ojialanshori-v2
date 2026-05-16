import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { emailService, fireEmail } from '#server/utils/email'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { approvePostForActor } from '#server/services/posts/postService'
import { requireId, zValidator } from '#server/utils/zod-validator'
import { reviewActionSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const actor = requireReviewer(event)
  const postId = requireId(event)
  const payload = await readValidatedBody(event, zValidator(reviewActionSchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await approvePostForActor(useDb(event), actor, postId, payload)

  fireEmail(
    event,
    emailService.sendPostApproved(event, {
      to: result.authorEmail,
      authorName: result.authorName,
      postTitle: result.postTitle,
      postSlug: result.postSlug,
    }),
    'sendPostApproved',
  )

  const sessionId = getHeader(event, 'x-posthog-session-id')
  const distinctId = getHeader(event, 'x-posthog-distinct-id')
  useServerPostHog().capture({
    distinctId: distinctId ?? actor.email ?? 'anonymous',
    event: 'post_approved',
    properties: {
      $session_id: sessionId,
      post_id: result.id,
      post_title: result.postTitle,
      actor_role: actor.role,
    },
  })

  return { id: result.id, status: result.status, publishedAt: result.publishedAt }
})
