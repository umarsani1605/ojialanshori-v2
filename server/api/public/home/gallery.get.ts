import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { asc } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) return []

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    return await db.select({
      id: schema.gallery.id,
      title: schema.gallery.title,
      imagePath: schema.gallery.imagePath,
      album: schema.gallery.album,
      order: schema.gallery.order,
    })
      .from(schema.gallery)
      .orderBy(asc(schema.gallery.order), asc(schema.gallery.id))
      .limit(6)
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'home-gallery',
})
