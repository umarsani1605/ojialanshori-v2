import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'

type Database = MySql2Database<typeof schema>

type BannerValues = {
  text: string
  link: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export async function listBanners(db: Database) {
  return db.select().from(schema.banners)
}

export async function findBannerById(db: Database, id: number) {
  return db.query.banners.findFirst({
    where: (b, { eq: eqFn }) => eqFn(b.id, id),
  })
}

export async function insertBanner(db: Database, values: BannerValues) {
  const [result] = await db.insert(schema.banners).values(values)
  return result.insertId
}

export async function updateBanner(db: Database, id: number, values: Partial<BannerValues>) {
  await db.update(schema.banners).set(values).where(eq(schema.banners.id, id))
}

export async function deleteBanner(db: Database, id: number) {
  await db.delete(schema.banners).where(eq(schema.banners.id, id))
}
