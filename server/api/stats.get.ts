import { count, desc, eq } from 'drizzle-orm'
import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const isAdmin = user.role === 'admin'

  if (isAdmin) {
    const [totalPostsResult, publishedResult, pendingResult, santriCountResult, galleryResult, recentPending] = await Promise.all([
      db.select({ count: count() }).from(schema.posts),
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, 'published')),
      db.select({ count: count() }).from(schema.posts).where(eq(schema.posts.status, 'pending_review')),
      db.select({ count: count() }).from(schema.users).where(eq(schema.users.role, 'santri')),
      db.select({ count: count() }).from(schema.gallery),
      db.query.posts.findMany({
        where: eq(schema.posts.status, 'pending_review'),
        orderBy: [desc(schema.posts.createdAt)],
        limit: 5,
        columns: { id: true, title: true, slug: true, createdAt: true, featuredImage: true },
        with: { author: { columns: { name: true } } },
      }),
    ])

    return {
      type: 'global' as const,
      totalPosts: totalPostsResult[0]?.count ?? 0,
      publishedPosts: publishedResult[0]?.count ?? 0,
      pendingReviewPosts: pendingResult[0]?.count ?? 0,
      totalSantri: santriCountResult[0]?.count ?? 0,
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
      columns: { id: true, title: true, slug: true, status: true, reviewNote: true, createdAt: true },
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
})
