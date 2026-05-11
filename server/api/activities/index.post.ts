import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { upsertActivitySchema } from '#server/schemas'

export default defineValidatedHandler(upsertActivitySchema, async (event, body) => {
  requireAdmin(event)
  const db = useDb(event)

  const [result] = await db.insert(activities).values({
    title: body.title,
    description: body.description ?? null,
    imagePath: body.imagePath,
    order: body.order ?? 0,
  })

  return { data: { id: result.insertId } }
})
