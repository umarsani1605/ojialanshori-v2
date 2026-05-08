import { and, count, desc, eq, ne } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import type { PostStatus } from '#server/db/schema'
import * as schema from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

export async function findPostById(db: Database, postId: number) {
  return db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
    with: {
      author: { columns: { id: true, fullname: true, email: true } },
      category: { columns: { id: true, name: true, type: true } },
      reviewer: { columns: { id: true, fullname: true } },
    },
  })
}

export async function findPostByIdForSantri(db: Database, postId: number, authorId: number) {
  return db.query.posts.findFirst({
    where: and(eq(schema.posts.id, postId), eq(schema.posts.authorId, authorId)),
    with: {
      category: { columns: { id: true, name: true, type: true } },
      reviewer: { columns: { id: true, fullname: true } },
    },
  })
}

export async function listAllPosts(db: Database) {
  return db.query.posts.findMany({
    orderBy: [desc(schema.posts.updatedAt)],
    columns: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
    },
    with: {
      author: { columns: { id: true, fullname: true } },
      category: { columns: { id: true, name: true, type: true } },
    },
  })
}

export async function listPostsForReview(db: Database) {
  return db.query.posts.findMany({
    where: eq(schema.posts.status, 'pending_review'),
    orderBy: [desc(schema.posts.updatedAt)],
    columns: { id: true, title: true, slug: true, status: true, updatedAt: true },
    with: {
      author: { columns: { id: true, fullname: true } },
      category: { columns: { id: true, name: true, type: true } },
    },
  })
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
