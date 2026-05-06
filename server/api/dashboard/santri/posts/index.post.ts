import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import {
  assertDraftPayload,
  ensureCategoryExists,
  generateUniquePostSlug,
  syncPostTags,
} from '#server/utils/santriPostEditor'
import { validateSantriPostBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const payload = await readValidatedBody(event, validateSantriPostBody)

  assertDraftPayload(payload)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)
  await ensureCategoryExists(db, payload.categoryId)

    const slug = await generateUniquePostSlug(db, payload.title)
    const result = await db.insert(schema.posts).values({
      title: payload.title,
      slug,
      content: payload.content,
      excerpt: payload.excerpt,
      featuredImage: payload.featuredImage,
      categoryId: payload.categoryId,
      authorId: currentUser.id,
      status: 'draft',
    })

    const postId = result[0].insertId
    await syncPostTags(db, postId, payload.tags)

  return {
    id: postId,
    slug,
    status: 'draft',
  }
})
