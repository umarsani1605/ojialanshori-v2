import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { requireSlug } from '#server/utils/zod-validator'
import { getPublicPost } from '#server/services/public/publicContentService'

export default defineEventHandler(async (event) => {
  const slug = requireSlug(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return { post: await getPublicPost(useDb(event), slug) }
})
