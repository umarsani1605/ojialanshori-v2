import { blob } from '@nuxthub/blob'
import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireAuth } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'

export default defineEventHandler(async (event) => {
  const currentUser = requireAuth(event)

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.id, currentUser.id),
    columns: { avatar: true },
  })
  const oldPath = existing?.avatar

  if (oldPath && oldPath.startsWith('/images/')) {
    const key = oldPath.replace(/^\/images\//, '')
    try { await blob.delete(key) } catch {}
  }

  await db.update(schema.users)
    .set({ avatar: null })
    .where(eq(schema.users.id, currentUser.id))

  await setUserSession(event, {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatar: null,
    },
  })

  return { success: true }
})
