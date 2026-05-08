import { afterEach, describe, expect, it, vi } from 'vitest'

const { listUsersForAdminMock } = vi.hoisted(() => ({
  listUsersForAdminMock: vi.fn(),
}))

vi.mock('~~/server/services/users/userService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~~/server/services/users/userService')>()
  return { ...actual, listUsersForAdmin: listUsersForAdminMock }
})

vi.mock('~~/server/utils/db', () => ({
  isMysqlConfigured: () => true,
  useDb: () => ({}),
}))

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  listUsersForAdminMock.mockReset()
})

describe('dashboard user routes', () => {
  it('rejects unauthenticated access to the users list', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

    const handler = (await import('~~/server/api/users/index.get')).default

    await expect(handler({ context: {} } as never)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    })
  })

  it('returns 400 for an invalid user id before hitting the database', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedRouterParams', () => Promise.resolve({ id: 0 }))

    const handler = (await import('~~/server/api/users/[id].patch')).default

    await expect(handler({
      context: {
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
    } as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'ID user tidak valid.',
    })
  })

  it('forwards server-side user filters from query params', async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getValidatedQuery', (_event: unknown, validator: (value: unknown) => unknown) =>
      Promise.resolve(validator({
        role: 'santri',
        status: 'active',
        search: 'umar',
        phone: '0812',
        yearEnrolled: '2024',
        university: 'UM',
      })))

    listUsersForAdminMock.mockResolvedValue([])

    const handler = (await import('~~/server/api/users/index.get')).default
    await handler({
      context: {
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
    } as never)

    expect(listUsersForAdminMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ id: 1, role: 'admin' }),
      {
        role: 'santri',
        status: 'active',
        search: 'umar',
        phone: '0812',
        yearEnrolled: 2024,
        university: 'UM',
      },
    )
  })
})
