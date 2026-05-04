import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, eq, gte, isNull, lte, or, type SQL } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) return null

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const today = new Date()
    const todayDate = today.toISOString().slice(0, 10) // YYYY-MM-DD

    const banner = await db.query.banners.findFirst({
      where: and(
        eq(schema.banners.isActive, true),
        or(
          isNull(schema.banners.startDate),
          lte(schema.banners.startDate, todayDate),
        ) as SQL,
        or(
          isNull(schema.banners.endDate),
          gte(schema.banners.endDate, todayDate),
        ) as SQL,
      ),
    })

    return banner ?? null
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'public-banner',
})
