import { and, count, desc, eq, gte } from 'drizzle-orm'
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  try {
    const [statusCounts, latestApprovedRows] = await Promise.all([
      db
        .select({ status: schema.posts.status, count: count() })
        .from(schema.posts)
        .where(eq(schema.posts.authorId, currentUser.id))
        .groupBy(schema.posts.status),
      db
        .select({
          id: schema.posts.id,
          title: schema.posts.title,
          slug: schema.posts.slug,
          publishedAt: schema.posts.publishedAt,
          categoryType: schema.categories.type,
        })
        .from(schema.posts)
        .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
        .where(and(
          eq(schema.posts.authorId, currentUser.id),
          eq(schema.posts.status, 'published'),
          gte(schema.posts.publishedAt, sevenDaysAgo),
        ))
        .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
        .limit(1),
    ])

    const countByStatus = Object.fromEntries(
      statusCounts.map(row => [row.status, row.count]),
    ) as Record<string, number>

    return {
      total: statusCounts.reduce((sum, row) => sum + row.count, 0),
      published: countByStatus.published ?? 0,
      pendingReview: countByStatus.pending_review ?? 0,
      rejected: countByStatus.rejected ?? 0,
      latestApprovedPost: latestApprovedRows[0] ?? null,
    }
  }
  finally {
    await connection.end()
  }
})
