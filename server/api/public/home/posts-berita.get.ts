import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, desc, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) return []

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const rows = await db.select({
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
      .where(and(
        eq(schema.posts.status, 'published'),
        eq(schema.categories.type, 'berita'),
      ))
      .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
      .limit(3)

    return rows
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'home-posts-berita',
})
