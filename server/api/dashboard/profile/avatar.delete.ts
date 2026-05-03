import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, currentUser.id),
      columns: { avatarPath: true },
    })
    const oldPath = existing?.avatarPath

    if (oldPath && oldPath.startsWith('/images/')) {
      const key = oldPath.replace(/^\/images\//, '')
      try { await hubBlob().delete(key) } catch {}
    }

    await db.update(schema.users)
      .set({ avatarPath: null })
      .where(eq(schema.users.id, currentUser.id))

    await setUserSession(event, {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatarPath: null,
      },
    })

    return { success: true }
  }
  finally {
    await connection.end()
  }
})
