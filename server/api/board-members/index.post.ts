import { boardMembers } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { zValidator } from '#server/utils/zod-validator'
import { upsertBoardMemberSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readValidatedBody(event, zValidator(upsertBoardMemberSchema))
  const db = useDb(event)

  const [result] = await db.insert(boardMembers).values({
    name: body.name,
    role: body.role,
    avatarPath: body.avatarPath ?? null,
    order: body.order ?? 0,
  })

  await markMutated(PublicCacheScopes.boardMembers)

  return { data: { id: result.insertId } }
})
