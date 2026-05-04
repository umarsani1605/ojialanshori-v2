import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { asc, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) return []

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    return await db.select({
      id: schema.testimonials.id,
      name: schema.testimonials.name,
      title: schema.testimonials.title,
      content: schema.testimonials.content,
      avatarPath: schema.testimonials.avatarPath,
      order: schema.testimonials.order,
    })
      .from(schema.testimonials)
      .where(eq(schema.testimonials.isActive, true))
      .orderBy(asc(schema.testimonials.order), asc(schema.testimonials.id))
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'home-testimonials',
})
