import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

export async function findUserForAuth(db: Database, identifier: string) {
  return db
    .select({
      id: schema.users.id,
      fullname: schema.users.fullname,
      email: schema.users.email,
      password: schema.users.password,
      passwordType: schema.users.passwordType,
      role: schema.users.role,
      avatar: schema.users.avatar,
      isActive: schema.users.isActive,
    })
    .from(schema.users)
    .where(eq(schema.users.email, identifier))
    .limit(1)
    .then(rows => rows[0] ?? null)
}

export async function updateUserPassword(
  db: Database,
  userId: number,
  password: string,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ password, passwordType: 'bcrypt' })
    .where(eq(schema.users.id, userId))
}
