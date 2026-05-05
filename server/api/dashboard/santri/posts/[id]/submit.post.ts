import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'
import {
  assertSubmitPayload,
  ensureCategoryExists,
  getSantriOwnedPost,
  parseSantriPostPayload,
  syncPostTags,
} from '~~/server/utils/santriPostEditor'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const postId = Number(getRouterParam(event, 'id'))
  const payload = parseSantriPostPayload(await readBody(event))

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  assertSubmitPayload(payload)

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MYSQL_URL is not configured' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
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
        rejectionNote: null,
      })
      .where(eq(schema.posts.id, existing.id))

    await syncPostTags(db, existing.id, payload.tags)

    return {
      id: existing.id,
      slug: existing.slug,
      status: 'pending_review',
    }
  }
  finally {
    await connection.end()
  }
})
