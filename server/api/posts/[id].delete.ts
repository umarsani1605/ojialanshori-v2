import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { deletePostForActor } from '#server/services/posts/postService'
import { requireId } from '#server/utils/zod-validator'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)
  const postId = requireId(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  return deletePostForActor(useDb(event), actor, postId)
})
