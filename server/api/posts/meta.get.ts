import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { getSantriEditorCategories } from '#server/utils/santriPostEditor'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const categories = await getSantriEditorCategories(db)
  return { categories }
})
