import { faqs } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { defineValidatedHandler } from '#server/utils/validated-handler'
import { upsertFaqSchema } from '#server/schemas'

export default defineValidatedHandler(upsertFaqSchema, async (event, body) => {
  requireAdmin(event)
  const db = useDb(event)

  const [result] = await db.insert(faqs).values({
    question: body.question,
    answer: body.answer,
    order: body.order ?? 0,
  })

  return { data: { id: result.insertId } }
})
