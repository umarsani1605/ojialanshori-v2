import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { count, desc, eq } from 'drizzle-orm'
import * as schema from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const isAdmin = user.role === 'superadmin' || user.role === 'pengurus'

    if (isAdmin) {
      const [publishedResult, pendingResult, userCountResult, galleryResult, recentPending] = await Promise.all([
        db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, 'published')),
        db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, 'pending_review')),
        db.select({ count: count() }).from(schema.users),
        db.select({ count: count() }).from(schema.gallery),
        db.query.posts.findMany({
          where: eq(schema.posts.status, 'pending_review'),
          orderBy: [desc(schema.posts.createdAt)],
          limit: 5,
          columns: { id: true, title: true, slug: true, createdAt: true },
          with: { author: { columns: { name: true } } },
        }),
      ])

      return {
        type: 'global' as const,
        publishedPosts: publishedResult[0]?.count ?? 0,
        pendingReviewPosts: pendingResult[0]?.count ?? 0,
        totalUsers: userCountResult[0]?.count ?? 0,
        totalGallery: galleryResult[0]?.count ?? 0,
        recentPendingPosts: recentPending,
      }
    }

    // Stats pribadi untuk santri & reviewer
    const [statusCounts, recentPosts] = await Promise.all([
      db
        .select({ status: schema.posts.status, count: count() })
        .from(schema.posts)
        .where(eq(schema.posts.authorId, user.id))
        .groupBy(schema.posts.status),
      db.query.posts.findMany({
        where: eq(schema.posts.authorId, user.id),
        orderBy: [desc(schema.posts.createdAt)],
        limit: 5,
        columns: { id: true, title: true, slug: true, status: true, rejectionNote: true, createdAt: true },
      }),
    ])

    const countByStatus = Object.fromEntries(
      statusCounts.map(row => [row.status, row.count]),
    ) as Record<string, number>

    return {
      type: 'personal' as const,
      totalPosts: statusCounts.reduce((sum, row) => sum + row.count, 0),
      publishedPosts: countByStatus.published ?? 0,
      pendingPosts: countByStatus.pending_review ?? 0,
      rejectedPosts: countByStatus.rejected ?? 0,
      draftPosts: countByStatus.draft ?? 0,
      recentPosts,
    }
  }
  finally {
    await connection.end()
  }
})
