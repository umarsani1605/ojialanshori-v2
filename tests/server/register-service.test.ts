import { afterEach, describe, expect, it, vi } from 'vitest'

const findUserByEmailOrUsername = vi.fn()
const findUserById = vi.fn()
const findUserByUsername = vi.fn()
const insertUser = vi.fn()

vi.mock('~~/server/repositories/users/userRepository', () => ({
  findUserByEmailOrUsername,
  findUserById,
  findUserByUsername,
  insertUser,
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('registerSantri', () => {
  it('creates an inactive santri account pending admin verification', async () => {
    findUserByEmailOrUsername.mockResolvedValue(null)
    findUserByUsername.mockResolvedValue(null)
    insertUser.mockResolvedValue(12)
    findUserById.mockResolvedValue({
      id: 12,
      name: 'Umar Sani',
      username: 'umar',
      email: 'umar@example.com',
      role: 'santri',
      isActive: false,
    })

    const { registerSantri } = await import('~~/server/services/auth/authService')

    await expect(registerSantri({} as never, {
      name: 'Umar Sani',
      email: 'umar@example.com',
      password: 'rahasia123',
    })).resolves.toMatchObject({
      id: 12,
      role: 'santri',
      isActive: false,
    })

    expect(insertUser).toHaveBeenCalledWith(
      {} as never,
      expect.objectContaining({
        name: 'Umar Sani',
        username: 'umar',
        email: 'umar@example.com',
        role: 'santri',
        isActive: false,
        passwordType: 'bcrypt',
      }),
    )
  })

  it('adds a numeric suffix when the generated username is already taken', async () => {
    findUserByEmailOrUsername.mockResolvedValue(null)
    findUserByUsername
      .mockResolvedValueOnce({ id: 3, username: 'umar' })
      .mockResolvedValueOnce(null)
    insertUser.mockResolvedValue(13)
    findUserById.mockResolvedValue({
      id: 13,
      name: 'Umar Sani',
      username: 'umar2',
      email: 'umar@example.com',
      role: 'santri',
      isActive: false,
    })

    const { registerSantri } = await import('~~/server/services/auth/authService')

    await registerSantri({} as never, {
      name: 'Umar Sani',
      email: 'umar@example.com',
      password: 'rahasia123',
    })

    expect(insertUser).toHaveBeenCalledWith(
      {} as never,
      expect.objectContaining({
        username: 'umar2',
      }),
    )
  })
})
