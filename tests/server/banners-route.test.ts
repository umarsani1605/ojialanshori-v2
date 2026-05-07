import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('GET /api/admin/banners', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/banners/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects non-admin (reviewer)', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/banners/index.get')).default

    await expect(handler({ context: { user: { id: 1, name: 'R', email: 'r@a.com', role: 'reviewer' } } } as never))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})
