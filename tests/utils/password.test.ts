import { describe, expect, it, vi } from 'vitest'

// node-phpass depends on native bcrypt binary which isn't available in test env.
// We mock via ESM dynamic import (password.ts now uses lazy import() instead of require()).
vi.mock('node-phpass', () => ({
  PasswordHash: class {
    CheckPassword(password: string, hash: string) {
      return hash === `phpass:${password}`
    }
  },
}))

import { hashPassword, verifyPassword } from '@@/server/utils/password'

describe('verifyPassword', () => {
  it('berhasil verifikasi phpass hash dari WordPress', async () => {
    // Simulated phpass hash — mock format is `phpass:<password>`
    const phpassHash = 'phpass:testpassword'
    expect(await verifyPassword('testpassword', phpassHash, 'phpass')).toBe(true)
  })

  it('berhasil verifikasi bcrypt hash', async () => {
    const hash = await hashPassword('testpassword')
    expect(await verifyPassword('testpassword', hash, 'bcrypt')).toBe(true)
  })

  it('return false untuk password salah', async () => {
    const hash = await hashPassword('correctpassword')
    expect(await verifyPassword('wrongpassword', hash, 'bcrypt')).toBe(false)
  })

  it('return false untuk hash kosong', async () => {
    expect(await verifyPassword('password', '', 'bcrypt')).toBe(false)
  })
})

describe('hashPassword', () => {
  it('menghasilkan bcrypt hash yang valid', async () => {
    const hash = await hashPassword('testpassword')
    expect(hash).toMatch(/^\$2[ayb]\$.{56}$/)
  })

  it('hash berbeda untuk input yang sama karena salt', async () => {
    const hash1 = await hashPassword('samepassword')
    const hash2 = await hashPassword('samepassword')
    expect(hash1).not.toBe(hash2)
  })
})
