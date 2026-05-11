/**
 * Ekstrak pesan error dari hasil $fetch / catch.
 * Server error yang dilempar via createError({ data: { message } }) akan diambil dari `data.message`.
 * Error JS biasa diambil dari `e.message`. Selain itu pakai fallback.
 */
export function errorMessage(e: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (e instanceof Error && e.message) return e.message
  return fallback
}
