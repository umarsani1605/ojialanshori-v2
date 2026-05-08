import { describe, expect, it } from 'vitest'
import { getInitials } from '~/utils/avatar'

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
