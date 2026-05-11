import { eq } from 'drizzle-orm'
import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { updateActivitySchema } from '#server/schemas'

export default defineValidatedHandler(updateActivitySchema, async (event, body) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)

  await db.update(activities).set(body).where(eq(activities.id, id))

  return { success: true }
})
