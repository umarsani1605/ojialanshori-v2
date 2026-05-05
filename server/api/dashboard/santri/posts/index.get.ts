import { and, count, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import type { PostStatus } from '~~/server/db/schema'
import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'

const VALID_STATUS = ['draft', 'pending_review', 'published', 'rejected'] as const satisfies PostStatus[]

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const query = getQuery(event)
  const status = typeof query.status === 'string' && VALID_STATUS.includes(query.status as PostStatus)
    ? query.status as PostStatus
    : undefined

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
    const baseWhere = eq(schema.posts.authorId, currentUser.id)
    const listWhere = status
      ? and(baseWhere, eq(schema.posts.status, status))
      : baseWhere

    const [rows, statusCounts] = await Promise.all([
      db
        .select({
          id: schema.posts.id,
          title: schema.posts.title,
          slug: schema.posts.slug,
          status: schema.posts.status,
          rejectionNote: schema.posts.rejectionNote,
          createdAt: schema.posts.createdAt,
          publishedAt: schema.posts.publishedAt,
          categoryName: schema.categories.name,
          categoryType: schema.categories.type,
        })
        .from(schema.posts)
        .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
        .where(listWhere)
        .orderBy(desc(schema.posts.createdAt)),
      db
        .select({ status: schema.posts.status, count: count() })
        .from(schema.posts)
        .where(baseWhere)
        .groupBy(schema.posts.status),
    ])

    const counts = Object.fromEntries(
      statusCounts.map((row) => [row.status, row.count]),
    ) as Partial<Record<PostStatus, number>>

    return {
      data: rows,
      counts: {
        all: statusCounts.reduce((sum, row) => sum + row.count, 0),
        published: counts.published ?? 0,
        pendingReview: counts.pending_review ?? 0,
        rejected: counts.rejected ?? 0,
        draft: counts.draft ?? 0,
      },
    }
  }
  finally {
    await connection.end()
  }
})
