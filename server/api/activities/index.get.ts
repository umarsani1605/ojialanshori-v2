import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const data = await db.query.activities.findMany({
    orderBy: (activities, { desc }) => [desc(activities.createdAt)]
  })
  return { data }
})