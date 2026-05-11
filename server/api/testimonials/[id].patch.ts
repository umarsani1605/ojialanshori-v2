import { eq } from 'drizzle-orm'
import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { zValidator } from '#server/utils/zod-validator'
import { updateTestimonialSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readValidatedBody(event, zValidator(updateTestimonialSchema))
  const db = useDb(event)

  await db.update(testimonials).set(body).where(eq(testimonials.id, id))

  return { success: true }
})
