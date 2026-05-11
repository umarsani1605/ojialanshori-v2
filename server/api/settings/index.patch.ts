import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAdmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { zValidator } from '#server/utils/zod-validator'
import { updateSettingsSchema } from '~~/shared/schemas'
import { updateSettings } from '#server/services/settings/settingService'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const { updates } = await readValidatedBody(event, zValidator(updateSettingsSchema))
  await updateSettings(useDb(event), updates)
  return { success: true }
})
