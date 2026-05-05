import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '~~/server/db/schema'
import { requireRole } from '~~/server/utils/guard'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID post tidak valid',
    })
  }

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  }

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    const post = await db.query.posts.findFirst({
      where: and(
        eq(schema.posts.id, id),
        eq(schema.posts.authorId, currentUser.id),
      ),
      columns: {
        id: true,
      },
    })

    if (!post) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Post tidak ditemukan atau bukan milik Anda',
      })
    }

    await db.delete(schema.posts).where(eq(schema.posts.id, id))

    return {
      ok: true,
    }
  }
  finally {
    await connection.end()
  }
})
