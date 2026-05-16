/**
 * Cek apakah path gambar berasal dari storage yang kita kelola (R2),
 * sehingga aman / berguna untuk dioptimasi via <NuxtImg> + IPX.
 *
 * Mendukung dua format:
 *   - Legacy: `/images/{key}` (diproxy via server route → 301 ke R2 domain)
 *   - Baru:   `https://{r2PublicDomain}/{key}` (langsung ke R2 custom domain)
 *
 * Bundled assets di `public/images/...` (logo, hero, dll) juga ikut match
 * `/images/` — ini sengaja, karena NuxtImg tetap bisa optimasi assets statis.
 */
export function isManagedImage(path: string | null | undefined): path is string {
  if (!path) return false
  if (path.startsWith('/images/')) return true
  const { public: { r2PublicDomain } } = useRuntimeConfig()
  return Boolean(r2PublicDomain) && path.startsWith(`https://${r2PublicDomain}/`)
}
