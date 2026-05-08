import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)
  await db.delete(faqs).where(eq(faqs.id, id))
  return { success: true }
})