import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicPageByTemplate } from '#server/services/public/publicContentService'
import { createDynamicInvalidator, PublicCacheScopes } from '#server/utils/publicCache'

export default defineCachedEventHandler(async (event) => {
  const template = getRouterParam(event, 'template')
  if (!template) {
    throw createError({ statusCode: 400, statusMessage: 'Template required' })
  }

  if (!isMysqlConfigured(event)) {
    return { title: template, meta: {} as Record<string, unknown>, updatedAt: null }
  }

  const row = await getPublicPageByTemplate(useDb(event), template)
  if (!row) {
    return { title: template, meta: {} as Record<string, unknown>, updatedAt: null }
  }

  const meta = typeof row.meta === 'string' ? JSON.parse(row.meta) : (row.meta ?? {})
  return { title: row.title, meta, updatedAt: row.updatedAt }
}, {
  maxAge: 60 * 60 * 24 * 365,
  staleMaxAge: -1,
  swr: true,
  name: 'public-page',
  getKey: event => `${getRouterParam(event, 'template') ?? 'unknown'}`,
  shouldInvalidateCache: createDynamicInvalidator(event =>
    PublicCacheScopes.page(getRouterParam(event, 'template') ?? 'unknown'),
  ),
})
