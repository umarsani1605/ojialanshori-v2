import { afterEach, describe, expect, it, vi } from 'vitest'

const { listPublicPostsMock } = vi.hoisted(() => ({
  listPublicPostsMock: vi.fn(),
}))

vi.mock('~~/server/services/public/publicContentService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~~/server/services/public/publicContentService')>()
  return { ...actual, listPublicPosts: listPublicPostsMock }
})

vi.mock('~~/server/utils/db', () => ({
  isMysqlConfigured: () => true,
  useDb: () => ({}),
}))

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  listPublicPostsMock.mockReset()
})

describe('GET /api/public/posts', () => {
  it('rejects requests without a valid type', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedQuery', (_event: unknown, validator: (value: unknown) => unknown) =>
      Promise.resolve(validator({})))

    const handler = (await import('~~/server/api/public/posts.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Query parameter "type" must be "berita" or "pena_santri".',
    })
  })

  it('forwards normalized query params to the service', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedQuery', (_event: unknown, validator: (value: unknown) => unknown) =>
      Promise.resolve(validator({
        type: 'berita',
        category: 'kajian',
        subcategory: 'tafsir',
        author: 'gus-ali',
        page: '0',
        limit: '50',
      })))

    listPublicPostsMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    })

    const handler = (await import('~~/server/api/public/posts.get')).default
    await handler({ context: {} } as never)

    expect(listPublicPostsMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        type: 'berita',
        category: 'kajian',
        subcategory: 'tafsir',
        author: 'gus-ali',
        page: 1,
        limit: 50,
      }),
    )
  })
})
