import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateAdminSettingsUpdateBody } from '#server/utils/validation'
import { updateSettings } from '#server/services/settings/settingService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { updates } = await readValidatedBody(event, validateAdminSettingsUpdateBody)
  await updateSettings(useDb(event), updates)
  return { success: true }
})
