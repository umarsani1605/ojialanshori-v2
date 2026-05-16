import { eq } from 'drizzle-orm'
import { activities } from '#server/db/schema'
import { useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { markMutated, PublicCacheScopes } from '#server/utils/publicCache'
import { zValidator } from '#server/utils/zod-validator'
import { updateActivitySchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0', 10)
  const body = await readValidatedBody(event, zValidator(updateActivitySchema))
  const db = useDb(event)

  await db.update(activities).set(body).where(eq(activities.id, id))

  await markMutated(PublicCacheScopes.activities)

  return { success: true }
})
