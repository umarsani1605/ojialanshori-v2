import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'
import { patchGalleryItem } from '#server/services/gallery/galleryService'

type PatchBody = {
  title?: string
  order?: number
}

function validateGalleryPatchBody(value: unknown): PatchBody {
  if (typeof value !== 'object' || value === null) {
    throw createError({ statusCode: 400, message: 'Payload tidak valid.' })
  }
  const body = value as Record<string, unknown>
  const result: PatchBody = {}

  if ('title' in body) {
    const t = typeof body.title === 'string' ? body.title.trim() : ''
    if (!t) throw createError({ statusCode: 400, message: 'Judul tidak boleh kosong.' })
    result.title = t
  }
  if ('order' in body) {
    const o = Number(body.order)
    result.order = Number.isFinite(o) ? Math.max(1, Math.trunc(o)) : 1
  }
  return result
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { id } = validateRouteIdParams(event.context.params)
  const body = await readValidatedBody(event, validateGalleryPatchBody)
  return { data: await patchGalleryItem(useDb(event), id, body) }
})
