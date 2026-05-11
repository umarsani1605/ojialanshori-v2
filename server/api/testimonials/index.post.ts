import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { upsertTestimonialSchema } from '#server/schemas'

export default defineValidatedHandler(upsertTestimonialSchema, async (event, body) => {
  requireAdmin(event)
  const db = useDb(event)

  const [result] = await db.insert(testimonials).values({
    name: body.name,
    title: body.title,
    content: body.content,
    avatarPath: body.avatarPath ?? null,
    order: body.order ?? 0,
  })

  return { data: { id: result.insertId } }
})
