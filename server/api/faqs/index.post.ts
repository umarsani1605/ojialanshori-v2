import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { zValidator } from '#server/utils/zod-validator'
import { upsertFaqSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readValidatedBody(event, zValidator(upsertFaqSchema))
  const db = useDb(event)

  const [result] = await db.insert(faqs).values({
    question: body.question,
    answer: body.answer,
    order: body.order ?? 0,
  })

  await markMutated(PublicCacheScopes.faqs)

  return { data: { id: result.insertId } }
})
