import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('POST /api/posts (create post)', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/index.post')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('GET /api/posts (list posts)', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('POST /api/posts/[id]/submit', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/[id]/submit.post')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('POST /api/posts/[id]/approve', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/[id]/approve.post')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('POST /api/posts/[id]/reject', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/[id]/reject.post')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('POST /api/posts/[id]/publish', () => {
  it('rejects unauthenticated access', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/posts/[id]/publish.post')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({ statusCode: 401 })
  })
})
