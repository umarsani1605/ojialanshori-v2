import { afterEach, describe, expect, it, vi } from 'vitest'

const createPool = vi.fn()
const drizzle = vi.fn()

vi.mock('mysql2/promise', () => ({
  default: {
    createPool,
  },
}))

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle,
}))

afterEach(() => {
  createPool.mockReset()
  drizzle.mockReset()
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

describe('server db utility', () => {
  it('throws when useDb is called without mysqlUrl runtime config', async () => {
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const { isMysqlConfigured, useDb } = await import('~~/server/utils/db')
    const event = createEvent()

    expect(isMysqlConfigured(event)).toBe(false)
    expect(() => useDb(event)).toThrow('Database tidak terkonfigurasi.')
    expect(createPool).not.toHaveBeenCalled()
  })

  it('resolves config from the request event and does not share db state across requests', async () => {
    vi.stubGlobal('useRuntimeConfig', (event: { context?: { runtimeConfig?: unknown } }) =>
      event.context?.runtimeConfig ?? {})

    const firstPool = { kind: 'pool-1' }
    const secondPool = { kind: 'pool-2' }
    const firstDb = { kind: 'db-1' }
    const secondDb = { kind: 'db-2' }

    createPool
      .mockReturnValueOnce(firstPool)
      .mockReturnValueOnce(secondPool)
    drizzle
      .mockReturnValueOnce(firstDb)
      .mockReturnValueOnce(secondDb)

    const { isMysqlConfigured, useDb, useDbClient } = await import('~~/server/utils/db')

    const firstEvent = createEvent('mysql://user:pass@localhost:3306/oji_first')
    const secondEvent = createEvent('mysql://user:pass@localhost:3306/oji_second')

    expect(isMysqlConfigured(firstEvent)).toBe(true)
    expect(isMysqlConfigured(secondEvent)).toBe(true)

    expect(useDbClient(firstEvent)).toBe(firstPool)
    expect(useDbClient(firstEvent)).toBe(firstPool)
    expect(useDb(firstEvent)).toBe(firstDb)
    expect(useDb(firstEvent)).toBe(firstDb)

    expect(useDbClient(secondEvent)).toBe(secondPool)
    expect(useDb(secondEvent)).toBe(secondDb)

    expect(createPool).toHaveBeenCalledTimes(2)
    expect(createPool).toHaveBeenNthCalledWith(1, 'mysql://user:pass@localhost:3306/oji_first')
    expect(createPool).toHaveBeenNthCalledWith(2, 'mysql://user:pass@localhost:3306/oji_second')
    expect(drizzle).toHaveBeenCalledTimes(2)
    expect(drizzle).toHaveBeenNthCalledWith(1, {
      client: firstPool,
      schema: expect.any(Object),
      casing: 'snake_case',
      mode: 'default',
    })
    expect(drizzle).toHaveBeenNthCalledWith(2, {
      client: secondPool,
      schema: expect.any(Object),
      casing: 'snake_case',
      mode: 'default',
    })
  })
})
