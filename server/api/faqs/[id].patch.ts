import { eq } from 'drizzle-orm'
import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { zValidator } from '#server/utils/zod-validator'
import { updateFaqSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readValidatedBody(event, zValidator(updateFaqSchema))
  const db = useDb(event)

  await db
    .update(faqs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(faqs.id, id))

  return { success: true }
})
