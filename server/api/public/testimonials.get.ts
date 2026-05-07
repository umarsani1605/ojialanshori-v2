import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicTestimonialList } from '#server/services/public/publicContentService'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return []
  return await getPublicTestimonialList(useDb(event))
}, {
  maxAge: 60,
  name: 'public-testimonials',
})
