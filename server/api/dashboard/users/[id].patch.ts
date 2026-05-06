import { and, eq, ne, or } from 'drizzle-orm'
import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { requireSuperadmin } from '#server/utils/guard'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { validateDashboardUserUpdateBody, validateRouteIdParams } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const currentUser = requireSuperadmin(event)

  const { id } = await getValidatedRouterParams(event, validateRouteIdParams)
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID user tidak valid.' })
  }

  if (id === currentUser.id) {
    throw createError({ statusCode: 403, message: 'Superadmin tidak bisa mengedit dirinya sendiri di sini. Gunakan halaman Profil.' })
  }

  const updates: Partial<typeof schema.users.$inferInsert> = await readValidatedBody(event, validateDashboardUserUpdateBody)

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada perubahan untuk disimpan.' })
  }

  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const db = useDb(event)

  const target = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!target) throw createError({ statusCode: 404, message: 'User tidak ditemukan.' })

  if (updates.email || updates.username) {
    const duplicates = [
      updates.email ? eq(schema.users.email, updates.email) : undefined,
      updates.username ? eq(schema.users.username, updates.username) : undefined,
    ].filter(Boolean) as NonNullable<ReturnType<typeof eq>>[]

    const orCondition = duplicates.length > 1 ? or(...duplicates) : duplicates[0]
    const duplicate = orCondition
      ? await db.query.users.findFirst({
        where: and(ne(schema.users.id, id), orCondition),
      })
      : null

    if (duplicate) {
      if (updates.email && duplicate.email === updates.email) {
        throw createError({ statusCode: 400, message: 'Email sudah terdaftar.' })
      }
      throw createError({ statusCode: 400, message: 'Username sudah terdaftar.' })
    }
  }

  await db.update(schema.users).set(updates).where(eq(schema.users.id, id))

  const updated = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    columns: { passwordHash: false, passwordType: false },
  })

  return { user: updated }
})
