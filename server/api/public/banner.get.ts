import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicActiveBanner } from '#server/services/public/publicContentService'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return null
  return await getPublicActiveBanner(useDb(event)) ?? null
}, {
  maxAge: 60,
  name: 'public-banner',
})
