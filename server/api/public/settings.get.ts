import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '~~/server/db/schema'

export default defineCachedEventHandler(async () => {
  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) return {}

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const rows = await db.select().from(schema.settings)
    return Object.fromEntries(rows.map(row => [row.key, row.value])) as Record<string, string>
  }
  finally {
    await connection.end()
  }
}, {
  maxAge: 60,
  name: 'public-settings',
})
