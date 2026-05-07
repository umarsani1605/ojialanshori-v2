import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('GET /api/admin/settings', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/settings/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects non-admin (santri)', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/settings/index.get')).default

    await expect(handler({ context: { user: { id: 1, name: 'S', email: 's@a.com', role: 'santri' } } } as never))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})
