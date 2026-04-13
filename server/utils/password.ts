import bcrypt from 'bcryptjs'

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
    // Lazy import: only loaded when verifying phpass (legacy WordPress) passwords
    const { PasswordHash } = await import('node-phpass') as { PasswordHash: new (iterations?: number, portable?: boolean) => { CheckPassword(password: string, hash: string): boolean } }
    const ph = new PasswordHash(8, true)
    return ph.CheckPassword(plain, hash) as boolean
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
