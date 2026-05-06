import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return {}

  const db = useDb(event)

  const rows = await db.select().from(schema.settings)
  return Object.fromEntries(rows.map(row => [row.key, row.value])) as Record<string, string>
}, {
  maxAge: 60,
  name: 'public-settings',
})
