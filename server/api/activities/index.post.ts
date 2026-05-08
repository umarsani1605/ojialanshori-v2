import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const db = useDb(event)
  
  const [result] = await db.insert(activities).values({
    title: body.title,
    description: body.description,
    imagePath: body.imagePath,
    order: body.order || 0
  })
  
  return { data: { id: result.insertId } }
})