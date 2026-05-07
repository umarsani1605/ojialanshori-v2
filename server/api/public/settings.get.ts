import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicSiteSettings } from '#server/services/public/publicContentService'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return {}
  return await getPublicSiteSettings(useDb(event))
}, {
  maxAge: 60,
  name: 'public-settings',
})
