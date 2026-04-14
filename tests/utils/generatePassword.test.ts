import { describe, expect, it } from 'vitest'
import { generatePassword } from '@@/server/utils/generatePassword'

describe('generatePassword', () => {
  it('default panjang 12 karakter', () => {
    expect(generatePassword().length).toBe(12)
  })

  it('panjang custom sesuai argumen', () => {
    expect(generatePassword(16).length).toBe(16)
    expect(generatePassword(20).length).toBe(20)
  })

  it('throw error jika panjang < 8', () => {
    expect(() => generatePassword(7)).toThrow('Password length must be >= 8')
  })

  it('mengandung minimal satu lowercase, uppercase, digit, dan simbol', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(12)
      expect(pwd).toMatch(/[a-z]/)
      expect(pwd).toMatch(/[A-Z]/)
      expect(pwd).toMatch(/[0-9]/)
      expect(pwd).toMatch(/[!@#$%&*]/)
    }
  })

  it('menghasilkan password yang berbeda setiap kali', () => {
    const passwords = new Set<string>()
    for (let i = 0; i < 50; i++) passwords.add(generatePassword(12))
    // Sangat kecil kemungkinan bentrok — hampir pasti 50 unik
    expect(passwords.size).toBeGreaterThan(45)
  })
})
