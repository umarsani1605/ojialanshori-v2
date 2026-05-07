import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicGalleryItems } from '#server/services/public/publicContentService'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return []
  return await getPublicGalleryItems(useDb(event))
}, {
  maxAge: 60,
  name: 'public-gallery',
})
