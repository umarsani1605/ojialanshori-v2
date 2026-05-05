import { and, count, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import type { CategoryType } from '~~/server/db/schema'
import * as schema from '~~/server/db/schema'

type PublicPostListOptions = {
  page?: number
  limit?: number
  type: CategoryType
}

export async function getPublicPostListing(options: PublicPostListOptions) {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  }

  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(24, Math.max(1, options.limit ?? 9))
  const offset = (page - 1) * limit

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const where = and(
      eq(schema.posts.status, 'published'),
      eq(schema.categories.type, options.type),
    )

    const [rows, totalResult] = await Promise.all([
      db.select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        excerpt: schema.posts.excerpt,
        featuredImage: schema.posts.featuredImage,
        publishedAt: schema.posts.publishedAt,
        createdAt: schema.posts.createdAt,
        categorySlug: schema.categories.slug,
        categoryName: schema.categories.name,
        authorName: schema.users.name,
      })
        .from(schema.posts)
        .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
        .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
        .where(where)
        .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(schema.posts)
        .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
        .where(where),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }
  finally {
    await connection.end()
  }
}
