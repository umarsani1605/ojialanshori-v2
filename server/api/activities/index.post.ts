import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { zValidator } from '#server/utils/zod-validator'
import { upsertActivitySchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readValidatedBody(event, zValidator(upsertActivitySchema))
  const db = useDb(event)

  const [result] = await db.insert(activities).values({
    title: body.title,
    description: body.description ?? null,
    imagePath: body.imagePath,
    order: body.order ?? 0,
  })

  return { data: { id: result.insertId } }
})
