import { afterEach, describe, expect, it, vi } from 'vitest'

const { eqMock } = vi.hoisted(() => ({
  eqMock: vi.fn((column, value) => ({ column, value })),
}))

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm')
  return {
    ...actual,
    eq: eqMock,
  }
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('getSantriEditorCategories', () => {
  it('requests only pena_santri categories for dashboard editors', async () => {
    const orderBy = vi.fn().mockResolvedValue([])
    const where = vi.fn(() => ({ orderBy }))
    const from = vi.fn(() => ({ where }))
    const select = vi.fn(() => ({ from }))

    const db = { select } as never

    const { getSantriEditorCategories } = await import('~~/server/utils/santriPostEditor')

    await getSantriEditorCategories(db)

    expect(select).toHaveBeenCalled()
    expect(from).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith(expect.anything(), 'pena_santri')
    expect(where).toHaveBeenCalledTimes(1)
    expect(orderBy).toHaveBeenCalledTimes(1)
  })
})
