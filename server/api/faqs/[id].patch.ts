import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readBody(event)
  const db = useDb(event)
  
  await db.update(faqs).set({
    question: body.question,
    answer: body.answer,
    order: body.order,
    updatedAt: new Date()
  }).where(eq(faqs.id, id))
  
  return { success: true }
})