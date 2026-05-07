import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminSettingsUpdateBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const { updates } = await readValidatedBody(event, validateAdminSettingsUpdateBody)
  const db = useDb(event)

  for (const [key, value] of Object.entries(updates)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } })
  }

  return { success: true }
})
