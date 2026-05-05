import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug diperlukan.' })

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const rows = await db.select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      content: schema.posts.content,
      excerpt: schema.posts.excerpt,
      featuredImage: schema.posts.featuredImage,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      categorySlug: schema.categories.slug,
      categoryName: schema.categories.name,
      categoryType: schema.categories.type,
      authorName: schema.users.name,
    })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(and(
        eq(schema.posts.slug, slug),
        eq(schema.posts.status, 'published'),
      ))
      .limit(1)

    const post = rows[0]
    if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

    return { post }
  }
  finally {
    await connection.end()
  }
})
