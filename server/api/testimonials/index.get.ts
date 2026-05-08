import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const db = useDb(event)
  const data = await db.query.testimonials.findMany({
    orderBy: (testimonials, { asc, desc }) => [asc(testimonials.order), desc(testimonials.createdAt)]
  })
  return { data }
})