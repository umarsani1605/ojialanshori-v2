import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'File tidak ditemukan.' })
  }

  const mime = file.type ?? 'application/octet-stream'
  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' })
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Ukuran file maksimal 2MB.' })
  }

  const ext = EXT_MAP[mime]!
  const storageKey = `avatars/${currentUser.id}/${Date.now()}.${ext}`
  const publicPath = `/images/${storageKey}`

  const blob = hubBlob()
  await blob.put(storageKey, file.data, { contentType: mime })

  const mysqlUrl = process.env.MYSQL_URL
  if (!mysqlUrl) throw createError({ statusCode: 500, message: 'Database tidak terkonfigurasi.' })

  const connection = await mysql.createConnection(mysqlUrl)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  try {
    // Remove old avatar from R2 if it exists
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, currentUser.id),
      columns: { avatarPath: true },
    })
    const oldPath = existing?.avatarPath
    if (oldPath && oldPath.startsWith('/images/')) {
      const oldKey = oldPath.replace(/^\/images\//, '')
      try { await blob.delete(oldKey) } catch {}
    }

    await db.update(schema.users)
      .set({ avatarPath: publicPath })
      .where(eq(schema.users.id, currentUser.id))

    await setUserSession(event, {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatarPath: publicPath,
      },
    })

    return { avatarPath: publicPath }
  }
  finally {
    await connection.end()
  }
})
