import { eq } from 'drizzle-orm'
import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readBody(event)
  const db = useDb(event)
  
  await db.update(activities).set({
    title: body.title,
    description: body.description,
    imagePath: body.imagePath,
    order: body.order
  }).where(eq(activities.id, id))
  
  return { success: true }
})