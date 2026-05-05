import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'
import { getSantriEditorCategories } from '~~/server/utils/santriPostEditor'

export default defineEventHandler(async (event) => {
  requireRole(event, ['santri'])

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MYSQL_URL is not configured' })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const categories = await getSantriEditorCategories(db)
    return { categories }
  }
  finally {
    await connection.end()
  }
})
