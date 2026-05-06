import { and, count, desc, eq } from 'drizzle-orm'

import type { PostStatus } from '#server/db/schema'
import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateSantriPostListQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const { status } = await getValidatedQuery(event, validateSantriPostListQuery)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const baseWhere = eq(schema.posts.authorId, currentUser.id)
  const listWhere = status
    ? and(baseWhere, eq(schema.posts.status, status))
    : baseWhere

  const [rows, statusCounts] = await Promise.all([
    db
      .select({
        ...schema.posts,
        categoryName: schema.categories.name,
        categoryType: schema.categories.type,
      })
      .from(schema.posts)
      .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
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
})
