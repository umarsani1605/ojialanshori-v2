import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { publicPostsQuerySchema } from '~~/shared/schemas'
import { listPublicPosts } from '#server/services/public/publicContentService'

export default defineEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const query = await getValidatedQuery(event, zValidator(publicPostsQuerySchema))

  return listPublicPosts(useDb(event), query)
})
