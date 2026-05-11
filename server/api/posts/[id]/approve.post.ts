import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { sendEmail } from '#server/utils/email'
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

  await sendEmail(event, {
    to: result.authorEmail,
    toName: result.authorName,
    subject: `Artikel kamu telah dipublish — ${result.postTitle}`,
    htmlContent: `
      <p>Halo ${result.authorName},</p>
      <p>Artikel kamu <strong>${result.postTitle}</strong> telah disetujui dan dipublish oleh <strong>${actor.fullname}</strong>.</p>
      <p>Baca di: <a href="https://ojialanshori.com/post/${result.postSlug}">ojialanshori.com/post/${result.postSlug}</a></p>
      <p>Terimakasih sudah berkontribusi!</p>
    `,
    textContent: `Halo ${result.authorName},\n\nArtikel "${result.postTitle}" telah dipublish oleh ${actor.fullname}.\n\nhttps://ojialanshori.com/post/${result.postSlug}`,
  })

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
