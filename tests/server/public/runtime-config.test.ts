import { afterEach, describe, expect, it, vi } from 'vitest'

const originalMysqlUrl = process.env.MYSQL_URL

afterEach(() => {
  if (originalMysqlUrl === undefined) {
    delete process.env.MYSQL_URL
  }
  else {
    process.env.MYSQL_URL = originalMysqlUrl
  }

  vi.resetModules()
})

describe('public runtime config guards', () => {
  it('posts-berita route throws when MYSQL_URL is missing', async () => {
    delete process.env.MYSQL_URL
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)

    const handler = (await import('~~/server/api/public/home/posts-berita.get')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  })

  it('posts-pena route throws when MYSQL_URL is missing', async () => {
    delete process.env.MYSQL_URL
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)

    const handler = (await import('~~/server/api/public/home/posts-pena.get')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  })

  it('public berita listing route throws when MYSQL_URL is missing', async () => {
    delete process.env.MYSQL_URL
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)
    vi.stubGlobal('getQuery', () => ({}))

    const handler = (await import('~~/server/api/public/posts/berita.get')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  })

  it('public pena santri listing route throws when MYSQL_URL is missing', async () => {
    delete process.env.MYSQL_URL
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) => input)
    vi.stubGlobal('getQuery', () => ({}))

    const handler = (await import('~~/server/api/public/posts/pena-santri.get')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'MYSQL_URL is not configured',
    })
  })

  it('public faqs route falls back to static content when MYSQL_URL is missing', async () => {
    delete process.env.MYSQL_URL
    vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/public/faqs.get')).default
    const result = await handler({} as never) as Array<{ question: string, answer: string }>

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      question: 'Bagaimana alur seleksi masuk Omah Ngaji?',
    })
  })
})
