import { describe, expect, it, vi } from 'vitest'

// Testing the custom verifyPhpass and bcrypt hash utilities

import { hashUserPassword as hashPassword, verifyUserPassword as verifyPassword } from '@@/server/utils/password'

describe('verifyPassword', () => {
  it('berhasil verifikasi phpass hash dari WordPress', async () => {
    // Real WordPress phpass hash for 'testpassword'
    const phpassHash = '$P$612345678JQBttCmD3BAlfh.49kKyD/'
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
