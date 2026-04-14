import { describe, expect, it } from 'vitest'
import { checkAccess } from '~/middleware/role'

describe('middleware/role — checkAccess', () => {
  it("requiredRole 'all' — semua role bisa akses", () => {
    expect(checkAccess('superadmin', 'all')).toBe(true)
    expect(checkAccess('pengurus', 'all')).toBe(true)
    expect(checkAccess('reviewer', 'all')).toBe(true)
    expect(checkAccess('santri', 'all')).toBe(true)
  })

  it("requiredRole 'reviewer' — santri tidak bisa akses", () => {
    expect(checkAccess('santri', 'reviewer')).toBe(false)
  })

  it("requiredRole 'reviewer' — reviewer bisa akses", () => {
    expect(checkAccess('reviewer', 'reviewer')).toBe(true)
  })

  it("requiredRole 'reviewer' — pengurus bisa akses", () => {
    expect(checkAccess('pengurus', 'reviewer')).toBe(true)
  })

  it("requiredRole 'admin' — reviewer tidak bisa akses", () => {
    expect(checkAccess('reviewer', 'admin')).toBe(false)
  })

  it("requiredRole 'admin' — pengurus bisa akses", () => {
    expect(checkAccess('pengurus', 'admin')).toBe(true)
  })

  it("requiredRole 'superadmin' — pengurus tidak bisa akses", () => {
    expect(checkAccess('pengurus', 'superadmin')).toBe(false)
  })

  it("requiredRole 'superadmin' — superadmin bisa akses", () => {
    expect(checkAccess('superadmin', 'superadmin')).toBe(true)
  })

  it('userRole undefined → false untuk semua requiredRole', () => {
    expect(checkAccess(undefined, 'all')).toBe(false)
    expect(checkAccess(undefined, 'superadmin')).toBe(false)
  })

  it('requiredRole tidak dikenali → false', () => {
    expect(checkAccess('superadmin', 'unknown-role')).toBe(false)
  })
})
