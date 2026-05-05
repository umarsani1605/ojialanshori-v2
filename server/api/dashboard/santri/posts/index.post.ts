import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'
import {
  assertDraftPayload,
  ensureCategoryExists,
  generateUniquePostSlug,
  parseSantriPostPayload,
  syncPostTags,
} from '~~/server/utils/santriPostEditor'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const payload = parseSantriPostPayload(await readBody(event))

  assertDraftPayload(payload)

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MYSQL_URL is not configured' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
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

    const postId = Number(result.insertId)
    await syncPostTags(db, postId, payload.tags)

    return {
      id: postId,
      slug,
      status: 'draft',
    }
  }
  finally {
    await connection.end()
  }
})
