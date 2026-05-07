import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validatePublicPostsQuery } from '#server/utils/validation'
import { listPublicPosts } from '#server/services/public/publicContentService'

export default defineEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const query = await getValidatedQuery(event, validatePublicPostsQuery)

  return listPublicPosts(useDb(event), {
    type: query.type,
    category: query.category,
    subcategory: query.subcategory,
    author: query.author,
    page: query.page,
    limit: query.limit,
  })
})
