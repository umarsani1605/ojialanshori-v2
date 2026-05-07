import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateSlugParams } from '#server/utils/validation'
import { getPublicPost } from '#server/services/public/publicContentService'

export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, validateSlugParams)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { post: await getPublicPost(useDb(event), slug) }
})
