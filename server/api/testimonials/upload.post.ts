import { blob } from '@nuxthub/blob'
import { requireAdmin } from '#server/utils/guard'

const MAX_SIZE = 5 * 1024 * 1024
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
    throw createError({ statusCode: 400, message: 'File gambar tidak ditemukan.' })
  }

  const mime = file.type ?? 'application/octet-stream'

  if (!ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.' })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Ukuran gambar maksimal 5MB.' })
  }

  const ext = EXT_MAP[mime]!
  const storageKey = `testimonials/${Date.now()}.${ext}`
  const publicPath = `/images/${storageKey}`

  await blob.put(storageKey, new Blob([file.data], { type: mime }), { contentType: mime })

  return { path: publicPath }
})