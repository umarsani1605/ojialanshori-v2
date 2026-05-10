import { and, count, desc, eq, ne } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import type { PostStatus } from '#server/db/schema'
import * as schema from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

async function fetchReviewer(db: Database, reviewedBy: number | null) {
  if (reviewedBy === null) return null
  const [r] = await db
    .select({ id: schema.users.id, fullname: schema.users.fullname })
    .from(schema.users)
    .where(eq(schema.users.id, reviewedBy))
    .limit(1)
  return r ?? null
}

export async function findPostById(db: Database, postId: number) {
  const [row] = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      content: schema.posts.content,
      excerpt: schema.posts.excerpt,
      featuredImage: schema.posts.featuredImage,
      categoryId: schema.posts.categoryId,
      authorId: schema.posts.authorId,
      reviewedBy: schema.posts.reviewedBy,
      status: schema.posts.status,
      reviewNote: schema.posts.reviewNote,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      updatedAt: schema.posts.updatedAt,
      authorUserId: schema.users.id,
      authorFullname: schema.users.fullname,
      authorEmail: schema.users.email,
      categoryRowId: schema.categories.id,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(eq(schema.posts.id, postId))
    .limit(1)

  if (!row) return undefined
  const reviewer = await fetchReviewer(db, row.reviewedBy)
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    featuredImage: row.featuredImage,
    categoryId: row.categoryId,
    authorId: row.authorId,
    reviewedBy: row.reviewedBy,
    status: row.status,
    reviewNote: row.reviewNote,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: { id: row.authorUserId!, fullname: row.authorFullname!, email: row.authorEmail! },
    category: row.categoryRowId !== null
      ? { id: row.categoryRowId, name: row.categoryName!, type: row.categoryType! }
      : null,
    reviewer,
  }
}

export async function findPostByIdForSantri(db: Database, postId: number, authorId: number) {
  const [row] = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      content: schema.posts.content,
      excerpt: schema.posts.excerpt,
      featuredImage: schema.posts.featuredImage,
      categoryId: schema.posts.categoryId,
      authorId: schema.posts.authorId,
      reviewedBy: schema.posts.reviewedBy,
      status: schema.posts.status,
      reviewNote: schema.posts.reviewNote,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      updatedAt: schema.posts.updatedAt,
      categoryRowId: schema.categories.id,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
    })
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.authorId, authorId)))
    .limit(1)

  if (!row) return undefined
  const reviewer = await fetchReviewer(db, row.reviewedBy)
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    featuredImage: row.featuredImage,
    categoryId: row.categoryId,
    authorId: row.authorId,
    reviewedBy: row.reviewedBy,
    status: row.status,
    reviewNote: row.reviewNote,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.categoryRowId !== null
      ? { id: row.categoryRowId, name: row.categoryName!, type: row.categoryType! }
      : null,
    reviewer,
  }
}

export async function listAllPosts(db: Database) {
  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      status: schema.posts.status,
      updatedAt: schema.posts.updatedAt,
      publishedAt: schema.posts.publishedAt,
      authorUserId: schema.users.id,
      authorFullname: schema.users.fullname,
      categoryRowId: schema.categories.id,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .orderBy(desc(schema.posts.updatedAt))

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    author: { id: row.authorUserId!, fullname: row.authorFullname! },
    category: row.categoryRowId !== null
      ? { id: row.categoryRowId, name: row.categoryName!, type: row.categoryType! }
      : null,
  }))
}

export async function listPostsForReview(db: Database) {
  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      status: schema.posts.status,
      updatedAt: schema.posts.updatedAt,
      authorUserId: schema.users.id,
      authorFullname: schema.users.fullname,
      categoryRowId: schema.categories.id,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .where(eq(schema.posts.status, 'pending_review'))
    .orderBy(desc(schema.posts.updatedAt))

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    updatedAt: row.updatedAt,
    author: { id: row.authorUserId!, fullname: row.authorFullname! },
    category: row.categoryRowId !== null
      ? { id: row.categoryRowId, name: row.categoryName!, type: row.categoryType! }
      : null,
  }))
}

export async function listOwnPenaSantriPosts(
  db: Database,
  authorId: number,
  status?: PostStatus,
) {
  const baseWhere = eq(schema.posts.authorId, authorId)
  const listWhere = status ? and(baseWhere, eq(schema.posts.status, status)) : baseWhere

  const [rows, statusCounts] = await Promise.all([
    db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        excerpt: schema.posts.excerpt,
        featuredImage: schema.posts.featuredImage,
        status: schema.posts.status,
        publishedAt: schema.posts.publishedAt,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        categoryId: schema.posts.categoryId,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
        categoryType: schema.categories.type,
        authorId: schema.users.id,
        authorFullname: schema.users.fullname,
      })
      .from(schema.posts)
      .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(listWhere)
      .orderBy(desc(schema.posts.createdAt)),
    db
      .select({ status: schema.posts.status, count: count() })
      .from(schema.posts)
      .where(baseWhere)
      .groupBy(schema.posts.status),
  ])

  const counts = Object.fromEntries(
    statusCounts.map(row => [row.status, row.count]),
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

export async function insertPost(
  db: Database,
  values: typeof schema.posts.$inferInsert,
): Promise<number> {
  const result = await db.insert(schema.posts).values(values)
  return result[0].insertId
}

export async function updatePost(
  db: Database,
  postId: number,
  values: Partial<typeof schema.posts.$inferInsert>,
): Promise<void> {
  await db.update(schema.posts).set(values).where(eq(schema.posts.id, postId))
}

export async function deletePost(db: Database, postId: number): Promise<void> {
  await db.delete(schema.posts).where(eq(schema.posts.id, postId))
}

export async function generateUniquePostSlug(
  db: Database,
  title: string,
  excludeId?: number,
): Promise<string> {
  const baseSlug = slugify(title)
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const existing = await db.query.posts.findFirst({
      where: excludeId
        ? and(eq(schema.posts.slug, candidate), ne(schema.posts.id, excludeId))
        : eq(schema.posts.slug, candidate),
      columns: { id: true },
    })

    if (!existing) return candidate

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}
