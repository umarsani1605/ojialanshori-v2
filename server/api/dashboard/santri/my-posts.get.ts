import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const rows = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        status: schema.posts.status,
        publishedAt: schema.posts.publishedAt,
        createdAt: schema.posts.createdAt,
        categoryName: schema.categories.name,
      })
      .from(schema.posts)
      .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .where(eq(schema.posts.authorId, currentUser.id))
      .orderBy(desc(schema.posts.createdAt))
      .limit(4)

    return { data: rows }
  }
  finally {
    await connection.end()
  }
})
