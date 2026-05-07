import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireReviewer } from '#server/utils/guard'
import { sendEmail } from '#server/utils/email'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { rejectPostForActor } from '#server/services/posts/postService'
import { validateRejectWithContentBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const actor = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateRejectWithContentBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await rejectPostForActor(useDb(event), actor, postId, payload)

  await sendEmail(event, {
    to: result.authorEmail,
    toName: result.authorName,
    subject: `Artikel kamu membutuhkan revisi — ${result.postTitle}`,
    htmlContent: `
      <p>Halo ${result.authorName},</p>
      <p>Artikel kamu <strong>${result.postTitle}</strong> membutuhkan beberapa revisi sebelum bisa dipublish.</p>
      <p><strong>Catatan dari ${result.reviewerName}:</strong></p>
      <div style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;">${result.reviewNote}</div>
      <p><a href="https://ojialanshori.com/dashboard/posts/${result.id}/edit">Edit Artikel</a></p>
    `,
    textContent: `Halo ${result.authorName},\n\nArtikel "${result.postTitle}" membutuhkan revisi.\n\nEdit di: https://ojialanshori.com/dashboard/posts/${result.id}/edit`,
  })

  return { id: result.id, status: result.status }
})
