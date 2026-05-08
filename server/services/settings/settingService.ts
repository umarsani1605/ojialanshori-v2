import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import { listSettings, upsertSetting } from '#server/repositories/settings/settingRepository'

type Database = MySql2Database<typeof schema>
const HIDDEN_SETTINGS_KEYS = new Set(['top_banner'])

export async function getSettingsForAdmin(db: Database) {
  const settings = await listSettings(db)
  return settings.filter(setting => !HIDDEN_SETTINGS_KEYS.has(setting.key))
}

export async function updateSettings(db: Database, updates: Record<string, string>) {
  for (const [key, value] of Object.entries(updates)) {
    await upsertSetting(db, key, value)
  }
}
