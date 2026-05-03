import { describe, expect, it } from 'vitest'
import { getInitials, getAvatarColor, AVATAR_COLORS } from '~/utils/avatar'

describe('getInitials', () => {
  it('return 2 huruf untuk nama dengan spasi ("Umar Sani" → "US")', () => {
    expect(getInitials('Umar Sani')).toBe('US')
  })

  it('return 1 huruf untuk nama tunggal ("Ahmad" → "A")', () => {
    expect(getInitials('Ahmad')).toBe('A')
  })

  it('handle nama dengan banyak kata (mengambil huruf pertama + terakhir)', () => {
    expect(getInitials('Abu Bakar Siddiq')).toBe('AS')
    expect(getInitials('Muhammad Al Fatih')).toBe('MF')
  })

  it('handle nama kosong / whitespace → return "?"', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
    expect(getInitials(null)).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })

  it('handle extra spasi', () => {
    expect(getInitials('  Umar   Sani  ')).toBe('US')
  })
})

describe('getAvatarColor', () => {
  it('return warna deterministik — input sama selalu return warna sama', () => {
    expect(getAvatarColor('Umar Sani')).toBe(getAvatarColor('Umar Sani'))
    expect(getAvatarColor('Ahmad')).toBe(getAvatarColor('Ahmad'))
  })

  it('return salah satu dari palet yang ditentukan', () => {
    for (const name of ['Ahmad', 'Umar Sani', 'Zaid', 'Muhammad', 'Abu Bakar Siddiq']) {
      expect(AVATAR_COLORS).toContain(getAvatarColor(name))
    }
  })

  it('handle nama kosong → return warna fallback neutral', () => {
    expect(getAvatarColor('')).toBe('#737373')
    expect(getAvatarColor(null)).toBe('#737373')
  })
})
