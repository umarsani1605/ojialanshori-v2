/**
 * Public cache invalidation via signal pattern.
 *
 * Daripada nebak format internal cache key Nitro, kita pakai opsi resmi
 * `shouldInvalidateCache` dari `defineCachedEventHandler` (Nitro docs).
 *
 * Pola:
 * - Admin mutate endpoint memanggil `markMutated('<scope>')` → tulis timestamp
 *   ke storage `cache` di key `public-mutation:<scope>`.
 * - Public cached endpoint men-pass `shouldInvalidateCache: createInvalidator('<scope>')`.
 *   Helper ini cek apakah ada signal mutate yang belum dikonsumsi. Kalau ada,
 *   return true → Nitro re-run handler, ambil data fresh, lalu signal dihapus.
 *
 * Konsekuensi:
 * - Tidak menggantungkan diri pada format key internal Nitro (cross-version safe).
 * - Cache tetap bekerja seperti biasa (memory storage, SWR).
 * - Window stale ≈ 0: signal dikonsumsi pada request berikutnya setelah mutate.
 */

const MUTATION_PREFIX = 'public-mutation:'

export const PublicCacheScopes = {
  testimonials: 'testimonials',
  faqs: 'faqs',
  boardMembers: 'board-members',
  activities: 'activities',
  settings: 'settings',
  gallery: 'gallery',
  banner: 'banner',
  page: (template: string) => `page:${template}`,
} as const

/**
 * Tulis signal "scope ini baru saja di-mutate" ke storage cache.
 */
export async function markMutated(scope: string) {
  await useStorage('cache').setItem(`${MUTATION_PREFIX}${scope}`, Date.now())
}

export async function markMutatedMany(scopes: string[]) {
  await Promise.all(scopes.map(markMutated))
}

/**
 * Internal: cek signal, kalau ada → hapus dan return true (consumed).
 */
async function checkAndConsume(scope: string): Promise<boolean> {
  const storage = useStorage('cache')
  const key = `${MUTATION_PREFIX}${scope}`
  const ts = await storage.getItem<number>(key)
  if (!ts) return false
  await storage.removeItem(key)
  return true
}

/**
 * Factory `shouldInvalidateCache` untuk scope statis.
 *
 *   defineCachedEventHandler(handler, {
 *     shouldInvalidateCache: createInvalidator('testimonials'),
 *   })
 */
export function createInvalidator(scope: string) {
  return () => checkAndConsume(scope)
}

/**
 * Factory `shouldInvalidateCache` untuk scope dinamis (mis. tergantung route param).
 *
 *   defineCachedEventHandler(handler, {
 *     shouldInvalidateCache: createDynamicInvalidator(event =>
 *       PublicCacheScopes.page(getRouterParam(event, 'template') ?? 'unknown')
 *     ),
 *   })
 */
export function createDynamicInvalidator(scopeFn: (event: import('h3').H3Event) => string) {
  return (event: import('h3').H3Event) => checkAndConsume(scopeFn(event))
}
