import { getR2PublicUrl, putR2 } from '~~/server/utils/r2Storage'

import { requireAuth } from '~~/server/utils/guard'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'cover' && part.filename)

  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'File cover tidak ditemukan.' })
  }

  const mime = file.type ?? 'application/octet-stream'
  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Format cover tidak didukung. Gunakan JPG, PNG, atau WebP.' })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Ukuran cover maksimal 2MB.' })
  }

  const ext = EXT_MAP[mime]!
  const storageKey = `covers/${currentUser.id}/${Date.now()}.${ext}`

  await putR2(event, storageKey, new Blob([file.data as any], { type: mime }), { contentType: mime })

  return { path: getR2PublicUrl(event, storageKey) }
})
