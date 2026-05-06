import { and, eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireRole } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireRole(event, ['santri'])
  const { id } = await getValidatedRouterParams(event, validateRouteIdParams)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID post tidak valid',
    })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const post = await db.query.posts.findFirst({
    where: and(
      eq(schema.posts.id, id),
      eq(schema.posts.authorId, currentUser.id),
    ),
    columns: {
      id: true,
    },
  })

  if (!post) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Post tidak ditemukan atau bukan milik Anda',
    })
  }

  await db.delete(schema.posts).where(eq(schema.posts.id, id))

  return {
    ok: true,
  }
})
