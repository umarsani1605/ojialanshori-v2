import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRejectBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const { reviewNote } = await readValidatedBody(event, validateRejectBody)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    columns: { id: true, title: true, slug: true, status: true },
    with: { author: { columns: { name: true, email: true } } },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }

  if (post.status !== 'pending_review') {
    throw createError({ statusCode: 409, message: 'Post tidak dalam status pending review.' })
  }

  await db.update(schema.posts)
    .set({ status: 'rejected', reviewNote, reviewedBy: reviewer.id })
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu membutuhkan revisi — ${post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${post.title}</strong> membutuhkan beberapa revisi sebelum bisa dipublish.</p>
      <p><strong>Catatan dari ${reviewer.name}:</strong></p>
      <div style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;">${reviewNote}</div>
      <p><a href="https://ojialanshori.com/dashboard/posts/${post.id}/edit">Edit Artikel</a></p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${post.title}" membutuhkan revisi.\n\nEdit di: https://ojialanshori.com/dashboard/posts/${post.id}/edit`,
  })

  return { id: postId, status: 'rejected' as const }
})
