import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

export type Database = MySql2Database<typeof schema>

export async function findUserForAuth(db: Database, identifier: string, isEmail: boolean) {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      username: schema.users.username,
      passwordHash: schema.users.passwordHash,
      passwordType: schema.users.passwordType,
      role: schema.users.role,
      avatar: schema.users.avatar,
      isActive: schema.users.isActive,
    })
    .from(schema.users)
    .where(isEmail
      ? eq(schema.users.email, identifier)
      : eq(schema.users.username, identifier))
    .limit(1)
    .then(rows => rows[0] ?? null)
}

export async function updateUserPasswordHash(
  db: Database,
  userId: number,
  passwordHash: string,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ passwordHash, passwordType: 'bcrypt' })
    .where(eq(schema.users.id, userId))
}
