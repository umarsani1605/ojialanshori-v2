import { blob } from '@nuxthub/blob'
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

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

  await blob.put(storageKey, file.data, { contentType: mime })

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)
  // Remove old avatar from R2 if it exists
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.id, currentUser.id),
    columns: { avatar: true },
  })
  const oldPath = existing?.avatar
  if (oldPath && oldPath.startsWith('/images/')) {
    const oldKey = oldPath.replace(/^\/images\//, '')
    try { await blob.delete(oldKey) } catch {}
  }

  await db.update(schema.users)
    .set({ avatar: publicPath })
    .where(eq(schema.users.id, currentUser.id))

  await setUserSession(event, {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatar: publicPath,
    },
  })

  return { avatar: publicPath }
})
