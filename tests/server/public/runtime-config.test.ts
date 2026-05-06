import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

function createEvent(mysqlUrl?: string) {
  return {
    context: {
      runtimeConfig: mysqlUrl ? { mysqlUrl } : {},
    },
  } as never
}

describe('public runtime config guards', () => {
  it('public posts route throws when mysqlUrl runtime config is missing', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)
    vi.stubGlobal('getValidatedQuery', () => Promise.resolve({ type: 'berita' }))
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const handler = (await import('~~/server/api/public/posts.get')).default

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  })

  it('public faqs route falls back to static content when mysqlUrl runtime config is missing', async () => {
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const handler = (await import('~~/server/api/public/faqs.get')).default
    const result = await handler(createEvent()) as Array<{ question: string, answer: string }>

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      question: 'Bagaimana alur seleksi masuk Omah Ngaji?',
    })
  })

  it('public faqs route falls back to static content when the db query fails', async () => {
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)
    vi.stubGlobal('useDb', () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => {
              throw new Error('db offline')
            },
          }),
        }),
      }),
    }))

    const handler = (await import('~~/server/api/public/faqs.get')).default
    const result = await handler(createEvent('mysql://user:pass@localhost:3306/oji_test')) as Array<{ question: string, answer: string }>

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      question: 'Bagaimana alur seleksi masuk Omah Ngaji?',
    })
  })

  it('public gallery route falls back to an empty array when mysqlUrl runtime config is missing', async () => {
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const handler = (await import('~~/server/api/public/gallery.get')).default
    const result = await handler(createEvent())

    expect(result).toEqual([])
  })

  it('public testimonials route falls back to an empty array when mysqlUrl runtime config is missing', async () => {
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const handler = (await import('~~/server/api/public/testimonials.get')).default
    const result = await handler(createEvent())

    expect(result).toEqual([])
  })
})
