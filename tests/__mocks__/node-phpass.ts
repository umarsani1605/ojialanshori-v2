// Mock for node-phpass — native bcrypt binary is unavailable in test environment.
// CheckPassword uses a simple format for testing dispatch logic.
export class PasswordHash {
  CheckPassword(password: string, hash: string): boolean {
    return hash === `phpass:${password}`
  }

  HashPassword(password: string): string {
    return `phpass:${password}`
  }
}

export const CRYPT_BLOWFISH = 'CRYPT_BLOWFISH'
export const CRYPT_EXT_DES = 'CRYPT_EXT_DES'
