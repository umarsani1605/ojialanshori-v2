import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

export async function listSettings(db: Database) {
  return db.select().from(schema.settings)
}

export async function findSettingByKey(db: Database, key: string) {
  return db.query.settings.findFirst({
    where: (setting, { eq }) => eq(setting.key, key),
  })
}

export async function upsertSetting(db: Database, key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } })
}
