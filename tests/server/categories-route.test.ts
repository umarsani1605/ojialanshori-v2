import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('GET /api/categories', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/categories/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects non-admin (reviewer)', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/categories/index.get')).default

    await expect(handler({ context: { user: { id: 1, name: 'R', email: 'r@a.com', role: 'reviewer' } } } as never))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('DELETE /api/categories/[id]', () => {
  it('rejects non-admin', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/categories/[id].delete')).default

    await expect(handler({ context: { user: { id: 1, name: 'Test', email: 'a@a.com', role: 'reviewer' } } } as never))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})
