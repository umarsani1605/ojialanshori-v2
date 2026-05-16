import { testimonials } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { zValidator } from '#server/utils/zod-validator'
import { upsertTestimonialSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readValidatedBody(event, zValidator(upsertTestimonialSchema))
  const db = useDb(event)

  const [result] = await db.insert(testimonials).values({
    name: body.name,
    title: body.title,
    content: body.content,
    avatarPath: body.avatarPath ?? null,
    order: body.order ?? 0,
  })

  await markMutated(PublicCacheScopes.testimonials)

  return { data: { id: result.insertId } }
})
