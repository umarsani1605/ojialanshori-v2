import { getPublicPostListing, normalizePublicPostListingOptions } from '#server/utils/publicPostListing'
import { validatePublicPostsQuery } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, validatePublicPostsQuery)

  const options = normalizePublicPostListingOptions({
    type: query.type,
    category: query.category,
    subcategory: query.subcategory,
    author: query.author,
    page: query.page,
    limit: query.limit,
    sort: query.sort,
  })

  return getPublicPostListing(event, options)
})
