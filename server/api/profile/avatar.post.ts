import { putR2, deleteR2 } from '~~/server/utils/r2Storage'

import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { setProfileAvatar } from '#server/services/profile/profileService'
import { findProfileById } from '#server/repositories/profile/profileRepository'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file?.data) throw createError({ statusCode: 400, message: 'File tidak ditemukan.' })

  const mime = file.type ?? 'application/octet-stream'
  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' })
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Ukuran file maksimal 2MB.' })
  }

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const db = useDb(event)
  const existing = await findProfileById(db, actor.id)
  const oldPath = existing?.avatar
  if (oldPath?.startsWith('/images/')) {
    try { await deleteR2(event, oldPath.replace(/^\/images\//, '')) } catch {}
  }

  const ext = EXT_MAP[mime]!
  const storageKey = `avatars/${actor.id}/${Date.now()}.${ext}`
  const publicPath = `/images/${storageKey}`

  await putR2(event, storageKey, file.data, { contentType: mime })
  await setProfileAvatar(db, actor.id, publicPath)

  await setUserSession(event, {
    user: { id: actor.id, fullname: actor.fullname, email: actor.email, role: actor.role, avatar: publicPath },
  })

  return { avatar: publicPath }
})
