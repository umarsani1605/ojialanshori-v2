import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import {
  deleteBanner,
  findBannerById,
  insertBanner,
  listBanners,
  updateBanner,
} from '#server/repositories/banners/bannerRepository'

type Database = MySql2Database<typeof schema>

type BannerBody = {
  text: string
  link?: string | null
  isActive?: boolean
  startDate?: string | null
  endDate?: string | null
}

export async function listBannersForAdmin(db: Database) {
  return listBanners(db)
}

export async function createBanner(db: Database, body: BannerBody) {
  const insertId = await insertBanner(db, {
    text: body.text,
    link: body.link ?? null,
    isActive: body.isActive ?? false,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
  })
  return findBannerById(db, insertId)
}

export async function patchBanner(db: Database, id: number, body: BannerBody) {
  const existing = await findBannerById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Banner tidak ditemukan.' })
  }

  await updateBanner(db, id, {
    text: body.text,
    link: body.link ?? null,
    isActive: body.isActive ?? existing.isActive,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
  })
  return findBannerById(db, id)
}

export async function removeBanner(db: Database, id: number) {
  const existing = await findBannerById(db, id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Banner tidak ditemukan.' })
  }
  await deleteBanner(db, id)
}
