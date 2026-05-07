import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('POST /api/auth/login', () => {
  it('rejects login with missing credentials', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('readValidatedBody', (_event: unknown, validator: (v: unknown) => unknown) =>
      Promise.resolve(validator({})))
    vi.stubGlobal('createError', (input: Record<string, unknown>) => input)
    vi.stubGlobal('getRequestIP', () => '127.0.0.1')
    vi.stubGlobal('isMysqlConfigured', () => true)

    const handler = (await import('~~/server/api/auth/login.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Identifier dan password wajib diisi.',
    })
  })

  it('rejects when IP cannot be determined', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('readValidatedBody', (_event: unknown, validator: (v: unknown) => unknown) =>
      Promise.resolve(validator({ identifier: 'test', password: 'pass1234' })))
    vi.stubGlobal('createError', (input: Record<string, unknown>) => input)
    vi.stubGlobal('getRequestIP', () => null)
    vi.stubGlobal('isMysqlConfigured', () => true)

    const handler = (await import('~~/server/api/auth/login.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
