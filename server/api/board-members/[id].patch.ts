import { eq } from 'drizzle-orm'
import { boardMembers } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { zValidator } from '#server/utils/zod-validator'
import { updateBoardMemberSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readValidatedBody(event, zValidator(updateBoardMemberSchema))
  const db = useDb(event)

  await db.update(boardMembers).set(body).where(eq(boardMembers.id, id))

  await markMutated(PublicCacheScopes.boardMembers)

  return { success: true }
})
