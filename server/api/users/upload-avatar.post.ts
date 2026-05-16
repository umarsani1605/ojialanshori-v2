import { putR2, getR2PublicUrl } from '~~/server/utils/r2Storage'

import { requireAdmin } from '#server/utils/guard'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'image' && part.filename)

  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'File avatar tidak ditemukan.' })
  }

  const mime = file.type ?? 'application/octet-stream'

  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Format avatar tidak didukung. Gunakan JPG, PNG, atau WebP.' })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Ukuran avatar maksimal 2MB.' })
  }

  const ext = EXT_MAP[mime]!
  const storageKey = `avatars/admin/${Date.now()}.${ext}`
  const publicPath = getR2PublicUrl(event, storageKey)

  await putR2(event, storageKey, new Blob([file.data as any], { type: mime }), { contentType: mime })

  return { path: publicPath }
})
