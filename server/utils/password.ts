import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'

// Phpass portable hash alphabet (WordPress-compatible)
const PHPASS_ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function phpassEncode64(input: Buffer, count: number): string {
  let output = ''
  let i = 0
  do {
    let value = input[i++]!
    output += PHPASS_ITOA64[value & 0x3f]!
    if (i < count) value |= (input[i]! << 8)
    output += PHPASS_ITOA64[(value >> 6) & 0x3f]!
    if (i++ >= count) break
    if (i < count) value |= (input[i]! << 16)
    output += PHPASS_ITOA64[(value >> 12) & 0x3f]!
    if (i++ >= count) break
    output += PHPASS_ITOA64[(value >> 18) & 0x3f]!
  } while (i < count)
  return output
}

/**
 * Verify a plaintext password against a WordPress phpass hash (pure JS, no native deps).
 */
function verifyPhpass(plain: string, storedHash: string): boolean {
  if (storedHash.length !== 34) return false
  const iterChar = storedHash[3]!
  const iterations = 1 << PHPASS_ITOA64.indexOf(iterChar)
  const salt = storedHash.slice(4, 12)

  let hash = createHash('md5').update(salt + plain).digest()
  for (let i = 0; i < iterations; i++) {
    const buf = Buffer.allocUnsafe(hash.length + Buffer.byteLength(plain))
    hash.copy(buf)
    buf.write(plain, hash.length)
    hash = createHash('md5').update(buf).digest()
  }

  const computed = storedHash.slice(0, 12) + phpassEncode64(hash, 16)
  return computed === storedHash
}

/**
 * Verify whether a plaintext password matches a stored phpass or bcrypt hash.
 *
 * @param plain - The plaintext password to verify
 * @param hash - The stored password hash to check against
 * @param type - Hash algorithm to use: `'phpass'` or `'bcrypt'`
 * @returns `true` if the plaintext matches the hash, `false` otherwise
 */
export async function verifyPassword(
  plain: string,
  hash: string,
  type: 'phpass' | 'bcrypt',
): Promise<boolean> {
  if (type === 'phpass') {
    return verifyPhpass(plain, hash)
  }
  return bcrypt.compare(plain, hash)
}

/**
 * Creates a bcrypt hash of a plaintext password.
 *
 * @param plain - The plaintext password to hash
 * @returns The bcrypt-formatted hash of `plain`
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}
