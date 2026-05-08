import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const db = useDb(event)
  
  const [result] = await db.insert(testimonials).values({
    name: body.name,
    title: body.title,
    content: body.content,
    avatarPath: body.avatarPath,
    order: body.order || 0
  })
  
  return { data: { id: result.insertId } }
})