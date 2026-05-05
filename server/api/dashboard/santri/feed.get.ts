import { and, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAuth(event)

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
        publishedAt: schema.posts.publishedAt,
        createdAt: schema.posts.createdAt,
        categoryName: schema.categories.name,
        categoryType: schema.categories.type,
        authorName: schema.users.name,
      })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(and(
        eq(schema.posts.status, 'published'),
        eq(schema.users.role, 'santri'),
      ))
      .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
      .limit(4)

    return { data: rows }
  }
  finally {
    await connection.end()
  }
})
