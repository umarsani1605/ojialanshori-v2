import { getPublicPostListing } from '~~/server/utils/publicPostListing'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return getPublicPostListing({
    type: 'berita',
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 9,
  })
})
