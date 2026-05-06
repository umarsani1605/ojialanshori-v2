import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('dashboard user routes', () => {
  it('rejects unauthenticated access to the users list', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/dashboard/users/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('returns 400 for an invalid user id before hitting the database', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedRouterParams', () => Promise.resolve({ id: 0 }))

    const handler = (await import('~~/server/api/dashboard/users/[id].patch')).default

    await expect(handler({
      context: {
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@example.com',
          role: 'superadmin',
        },
      },
    } as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'ID user tidak valid.',
    })
  })
})
