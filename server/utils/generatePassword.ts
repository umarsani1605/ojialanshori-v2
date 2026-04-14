import { randomInt } from 'node:crypto'

const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%&*'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

export function generatePassword(length = 12): string {
  if (length < 8) throw new Error('Password length must be >= 8')

  const chars = [
    LOWER[randomInt(LOWER.length)],
    UPPER[randomInt(UPPER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ]

  for (let i = chars.length; i < length; i++) {
    chars.push(ALL[randomInt(ALL.length)]!)
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }

  return chars.join('')
}
