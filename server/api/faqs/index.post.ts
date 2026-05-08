import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const db = useDb(event)
  
  const [result] = await db.insert(faqs).values({
    question: body.question,
    answer: body.answer,
    order: body.order || 0,
    isActive: body.isActive ?? true
  })
  
  return { data: { id: result.insertId } }
})