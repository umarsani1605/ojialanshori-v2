import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'
import { getSantriOwnedPost } from '~~/server/utils/santriPostEditor'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const postId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(postId) || postId <= 0) {
    throw createError({ statusCode: 400, message: 'ID post tidak valid.' })
  }

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MYSQL_URL is not configured' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const [post, tagRows] = await Promise.all([
      getSantriOwnedPost(db, postId, currentUser.id),
      db
        .select({ name: schema.tags.name })
        .from(schema.postTags)
        .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
        .innerJoin(schema.posts, eq(schema.postTags.postId, schema.posts.id))
        .where(and(eq(schema.postTags.postId, postId), eq(schema.posts.authorId, currentUser.id))),
    ])

    return {
      data: {
        ...post,
        tags: tagRows.map(tag => tag.name),
      },
    }
  }
  finally {
    await connection.end()
  }
})
