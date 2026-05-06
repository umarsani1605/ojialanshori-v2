import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import {
  assertSubmitPayload,
  ensureCategoryExists,
  getSantriOwnedPost,
  syncPostTags,
} from '#server/utils/santriPostEditor'
import { validateRouteIdParams, validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const { id: postId } = await getValidatedRouterParams(event, validateRouteIdParams)
  const payload = await readValidatedBody(event, validateSantriPostBody)

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  assertSubmitPayload(payload)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const existing = await getSantriOwnedPost(db, postId, currentUser.id)

  if (existing.status === 'pending_review') {
    throw createError({ statusCode: 403, message: 'Post yang sedang direview tidak bisa dikirim ulang.' })
  }

  await ensureCategoryExists(db, payload.categoryId)

  await db.update(schema.posts)
    .set({
      title: payload.title,
      slug: existing.slug,
      content: payload.content,
      excerpt: payload.excerpt,
      featuredImage: payload.featuredImage,
      categoryId: payload.categoryId,
      status: 'pending_review',
      reviewNote: null,
    })
    .where(eq(schema.posts.id, existing.id))

  await syncPostTags(db, existing.id, payload.tags)

  return {
    id: existing.id,
    slug: existing.slug,
    status: 'pending_review',
  }
})
