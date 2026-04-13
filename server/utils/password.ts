import bcrypt from 'bcryptjs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PasswordHash } = require('node-phpass') as { PasswordHash: new (iterations?: number, portable?: boolean) => { CheckPassword(password: string, hash: string): boolean } }

export async function verifyPassword(
  plain: string,
  hash: string,
  type: 'phpass' | 'bcrypt',
): Promise<boolean> {
  if (type === 'phpass') {
    const ph = new PasswordHash(8, true)
    return ph.CheckPassword(plain, hash) as boolean
  }
  return bcrypt.compare(plain, hash)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}
