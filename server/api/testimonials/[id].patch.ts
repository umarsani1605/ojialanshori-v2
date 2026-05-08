import { eq } from 'drizzle-orm'
import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readBody(event)
  const db = useDb(event)
  
  await db.update(testimonials).set({
    name: body.name,
    title: body.title,
    content: body.content,
    avatarPath: body.avatarPath,
    order: body.order
  }).where(eq(testimonials.id, id))
  
  return { success: true }
})