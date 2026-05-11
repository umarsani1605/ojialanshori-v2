import { eq } from 'drizzle-orm'
import { boardMembers } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { updateBoardMemberSchema } from '#server/schemas'

export default defineValidatedHandler(updateBoardMemberSchema, async (event, body) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)

  await db.update(boardMembers).set(body).where(eq(boardMembers.id, id))

  return { success: true }
})
