import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateReviewActionBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const contentUpdate = await readValidatedBody(event, validateReviewActionBody)

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

  const now = new Date()

  const updatePayload: Record<string, unknown> = {
    status: 'published',
    publishedAt: now,
    reviewedBy: reviewer.id,
  }
  if (contentUpdate.title !== undefined) updatePayload.title = contentUpdate.title
  if (contentUpdate.content !== undefined) updatePayload.content = contentUpdate.content
  if (contentUpdate.excerpt !== undefined) updatePayload.excerpt = contentUpdate.excerpt
  if (contentUpdate.categoryId !== undefined) updatePayload.categoryId = contentUpdate.categoryId
  if (contentUpdate.featuredImage !== undefined) updatePayload.featuredImage = contentUpdate.featuredImage
  if (contentUpdate.tags !== undefined) updatePayload.tags = contentUpdate.tags

  await db.update(schema.posts)
    .set(updatePayload)
    .where(eq(schema.posts.id, postId))

  const displayTitle = contentUpdate.title ?? post.title

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu telah dipublish — ${displayTitle}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${displayTitle}</strong> telah disetujui dan dipublish oleh <strong>${reviewer.name}</strong>.</p>
      <p>Baca di: <a href="https://ojialanshori.com/post/${post.slug}">ojialanshori.com/post/${post.slug}</a></p>
      <p>Terimakasih sudah berkontribusi!</p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${displayTitle}" telah dipublish oleh ${reviewer.name}.\n\nhttps://ojialanshori.com/post/${post.slug}`,
  })

  return { id: postId, status: 'published' as const, publishedAt: now }
})
