import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicFaqList } from '#server/services/public/publicContentService'
import { createInvalidator, PublicCacheScopes } from '#server/utils/publicCache'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return []

  const rows = await getPublicFaqList(useDb(event))
  return rows.map(({ question, answer }) => ({ question, answer }))
}, {
  maxAge: 60 * 60 * 24 * 365,
  staleMaxAge: -1,
  swr: true,
  name: 'public-faqs',
  shouldInvalidateCache: createInvalidator(PublicCacheScopes.faqs),
})
