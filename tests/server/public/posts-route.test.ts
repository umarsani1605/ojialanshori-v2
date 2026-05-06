import { afterEach, describe, expect, it, vi } from 'vitest'

const getPublicPostListing = vi.fn()

vi.mock('~~/server/utils/publicPostListing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~~/server/utils/publicPostListing')>()

  return {
    ...actual,
    getPublicPostListing,
  }
})

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  getPublicPostListing.mockReset()
})

describe('GET /api/public/posts', () => {
  it('rejects requests without a valid type', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedQuery', (_event: unknown, validator: (value: unknown) => unknown) =>
      Promise.resolve(validator({})))
    vi.stubGlobal('createError', (input: Record<string, unknown>) => input)

    const handler = (await import('~~/server/api/public/posts.get')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Query parameter "type" must be "berita" or "pena_santri".',
    })
  })

  it('forwards normalized query params to the listing util', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedQuery', (_event: unknown, validator: (value: unknown) => unknown) =>
      Promise.resolve(validator({
        type: 'berita',
        category: 'kajian',
        subcategory: 'tafsir',
        author: 'gus-ali',
        page: '0',
        limit: '50',
        sort: 'oldest',
      })))

    getPublicPostListing.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    })

    const handler = (await import('~~/server/api/public/posts.get')).default

    const event = { context: {} } as never
    await handler(event)

    expect(getPublicPostListing).toHaveBeenCalledWith({
      context: {},
    }, {
      type: 'berita',
      category: 'kajian',
      subcategory: 'tafsir',
      author: 'gus-ali',
      page: 1,
      limit: 24,
      sort: 'latest',
    })
  })
})
