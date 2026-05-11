import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { updateFaqSchema } from '#server/schemas'

export default defineValidatedHandler(updateFaqSchema, async (event, body) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)

  await db
    .update(faqs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(faqs.id, id))

  return { success: true }
})
