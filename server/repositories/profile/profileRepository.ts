import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

export async function findProfileById(db: Database, userId: number) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { password: false, passwordType: false },
  })
}

export async function updateProfile(
  db: Database,
  userId: number,
  values: Partial<typeof schema.users.$inferInsert>,
): Promise<void> {
  await db.update(schema.users).set(values).where(eq(schema.users.id, userId))
}

export async function findUserCredentials(db: Database, userId: number) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: {
      id: true,
      passwordHash: true,
      passwordType: true,
    },
  })
}
