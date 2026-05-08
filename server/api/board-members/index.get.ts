import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const data = await db.query.boardMembers.findMany({
    orderBy: (members, { asc }) => [asc(members.order), asc(members.createdAt)]
  })
  return { data }
})