import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import { listSettings, upsertSetting } from '#server/repositories/settings/settingRepository'

type Database = MySql2Database<typeof schema>

export async function getSettingsForAdmin(db: Database) {
  return listSettings(db)
}

export async function updateSettings(db: Database, updates: Record<string, string>) {
  for (const [key, value] of Object.entries(updates)) {
    await upsertSetting(db, key, value)
  }
}
