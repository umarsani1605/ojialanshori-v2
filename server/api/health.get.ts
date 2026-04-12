import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL

  if (!mysqlUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MYSQL_URL is not configured' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection)

  try {
    await db.execute(sql`SELECT 1`)
    return { status: 'ok', db: 'connected' }
  }
  finally {
    await connection.end()
  }
})
