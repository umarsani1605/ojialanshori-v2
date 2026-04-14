import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, currentUser.id),
      columns: { passwordHash: false, passwordType: false },
    })
    if (!user) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })
    return { user }
  }
  finally {
    await connection.end()
  }
})
