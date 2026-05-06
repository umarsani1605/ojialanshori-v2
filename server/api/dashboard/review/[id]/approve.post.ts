import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { sendEmail } from '#server/utils/email'
import { requireReviewer } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const reviewer = requireReviewer(event)
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)

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

  await db.update(schema.posts)
    .set({ status: 'published', publishedAt: now, reviewedBy: reviewer.id })
    .where(eq(schema.posts.id, postId))

  await sendEmail(event, {
    to: post.author.email,
    toName: post.author.name,
    subject: `Artikel kamu telah dipublish — ${post.title}`,
    htmlContent: `
      <p>Halo ${post.author.name},</p>
      <p>Artikel kamu <strong>${post.title}</strong> telah disetujui dan dipublish oleh <strong>${reviewer.name}</strong>.</p>
      <p>Baca di: <a href="https://ojialanshori.com/post/${post.slug}">ojialanshori.com/post/${post.slug}</a></p>
      <p>Terimakasih sudah berkontribusi!</p>
    `,
    textContent: `Halo ${post.author.name},\n\nArtikel "${post.title}" telah dipublish oleh ${reviewer.name}.\n\nhttps://ojialanshori.com/post/${post.slug}`,
  })

  return { id: postId, status: 'published' as const, publishedAt: now }
})
