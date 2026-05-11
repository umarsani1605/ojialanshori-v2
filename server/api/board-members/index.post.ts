import { boardMembers } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { upsertBoardMemberSchema } from '#server/schemas'

export default defineValidatedHandler(upsertBoardMemberSchema, async (event, body) => {
  requireAdmin(event)
  const db = useDb(event)

  const [result] = await db.insert(boardMembers).values({
    name: body.name,
    role: body.role,
    avatarPath: body.avatarPath ?? null,
    order: body.order ?? 0,
  })

  return { data: { id: result.insertId } }
})
