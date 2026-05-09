import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

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

export async function verifyUserPassword(
  plain: string,
  hash: string,
  type: 'phpass' | 'bcrypt',
): Promise<boolean> {
  if (type === 'phpass') {
    if (hash.startsWith('$P$')) {
      return verifyPhpass(plain, hash);
    }
    // Handle WordPress's modified bcrypt hashes ($wp$...)
    if (hash.startsWith('$wp$')) {
      const normalizedBcryptHash = hash.replace('$wp$', '$');
      return bcrypt.compare(plain, normalizedBcryptHash);
    }
  }
  return bcrypt.compare(plain, hash)
}

console.log('Testing...');
console.log('Is valid WP Bcrypt?', await verifyUserPassword('wrongpassword', '$wp$2y$10$5CG2SwZGLrV7fWDFGAd5f.qTdZqcFKm4bgonkif2iuCXg4zTHTBUW', 'phpass'));
