import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import { findSettingByKey, upsertSetting } from '#server/repositories/settings/settingRepository'

type Database = MySql2Database<typeof schema>

const BANNER_SETTING_KEY = 'top_banner'

export type BannerConfig = {
  text: string
  link: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

type BannerBody = {
  text: string
  link?: string | null
  isActive?: boolean
  startDate?: string | null
  endDate?: string | null
}

function getDefaultBannerConfig(): BannerConfig {
  return {
    text: '',
    link: null,
    isActive: false,
    startDate: null,
    endDate: null,
  }
}

function normalizeBannerConfig(value: unknown): BannerConfig {
  if (!value || typeof value !== 'object') {
    return getDefaultBannerConfig()
  }

  const raw = value as Record<string, unknown>

  return {
    text: typeof raw.text === 'string' ? raw.text : '',
    link: typeof raw.link === 'string' && raw.link.length > 0 ? raw.link : null,
    isActive: raw.isActive === true,
    startDate: typeof raw.startDate === 'string' && raw.startDate.length > 0 ? raw.startDate : null,
    endDate: typeof raw.endDate === 'string' && raw.endDate.length > 0 ? raw.endDate : null,
  }
}

function parseBannerConfig(value: string | null | undefined): BannerConfig {
  if (!value) {
    return getDefaultBannerConfig()
  }

  try {
    return normalizeBannerConfig(JSON.parse(value))
  } catch {
    return getDefaultBannerConfig()
  }
}

function buildBannerConfig(body: BannerBody): BannerConfig {
  return {
    text: body.text,
    link: body.link ?? null,
    isActive: body.isActive ?? false,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
  }
}

export async function getBannerConfig(db: Database) {
  const setting = await findSettingByKey(db, BANNER_SETTING_KEY)
  return parseBannerConfig(setting?.value)
}

export async function listBannersForAdmin(db: Database) {
  return getBannerConfig(db)
}

export async function createBanner(db: Database, body: BannerBody) {
  const config = buildBannerConfig(body)
  await upsertSetting(db, BANNER_SETTING_KEY, JSON.stringify(config))
  return config
}

export async function patchBanner(db: Database, _id: number, body: BannerBody) {
  const config = buildBannerConfig(body)
  await upsertSetting(db, BANNER_SETTING_KEY, JSON.stringify(config))
  return config
}

export async function removeBanner(db: Database, _id: number) {
  const config = getDefaultBannerConfig()
  await upsertSetting(db, BANNER_SETTING_KEY, JSON.stringify(config))
}
