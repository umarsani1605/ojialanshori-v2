import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicActiveBanner } from '#server/services/public/publicContentService'
import { createInvalidator, PublicCacheScopes } from '#server/utils/publicCache'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return null
  return await getPublicActiveBanner(useDb(event)) ?? null
}, {
  maxAge: 60 * 60 * 24 * 365,
  staleMaxAge: -1,
  swr: true,
  name: 'public-banner',
  shouldInvalidateCache: createInvalidator(PublicCacheScopes.banner),
})
