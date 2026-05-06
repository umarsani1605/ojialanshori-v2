import { describe, expect, it } from 'vitest'
import {
  getRoleCluster,
  getRoleHomePath,
  isAdminRole,
  isDashboardRole,
} from '~/utils/roleRoute'

describe('utils/roleRoute', () => {
  it('maps admin roles to /admin home', () => {
    expect(getRoleHomePath('superadmin')).toBe('/admin')
    expect(getRoleHomePath('pengurus')).toBe('/admin')
  })

  it('maps dashboard roles to /dashboard home', () => {
    expect(getRoleHomePath('reviewer')).toBe('/dashboard')
    expect(getRoleHomePath('santri')).toBe('/dashboard')
  })

  it('falls back to /dashboard for unknown roles', () => {
    expect(getRoleHomePath(undefined)).toBe('/dashboard')
    expect(getRoleHomePath('unknown')).toBe('/dashboard')
  })

  it('returns the expected cluster per role', () => {
    expect(getRoleCluster('superadmin')).toBe('admin')
    expect(getRoleCluster('pengurus')).toBe('admin')
    expect(getRoleCluster('reviewer')).toBe('dashboard')
    expect(getRoleCluster('santri')).toBe('dashboard')
  })

  it('exposes explicit admin and dashboard role guards', () => {
    expect(isAdminRole('superadmin')).toBe(true)
    expect(isAdminRole('pengurus')).toBe(true)
    expect(isAdminRole('reviewer')).toBe(false)
    expect(isDashboardRole('reviewer')).toBe(true)
    expect(isDashboardRole('santri')).toBe(true)
    expect(isDashboardRole('superadmin')).toBe(false)
  })
})
