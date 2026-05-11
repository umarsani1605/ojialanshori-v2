import { eq } from 'drizzle-orm'
import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { updateTestimonialSchema } from '#server/schemas'

export default defineValidatedHandler(updateTestimonialSchema, async (event, body) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const db = useDb(event)

  await db.update(testimonials).set(body).where(eq(testimonials.id, id))

  return { success: true }
})
