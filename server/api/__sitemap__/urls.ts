import { isMysqlConfigured, useDb } from '#server/utils/db'
import { listPublicPageTemplates } from '#server/services/public/publicContentService'

const TEMPLATE_TO_PATH: Record<string, string> = {
  home: '/',
  profile: '/profil',
  activities: '/kegiatan',
  faq: '/faq',
}

export default defineSitemapEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return []

  const rows = await listPublicPageTemplates(useDb(event))
  return rows
    .filter(row => row.template in TEMPLATE_TO_PATH)
    .map(row => ({
      loc: TEMPLATE_TO_PATH[row.template],
      lastmod: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    }))
})
