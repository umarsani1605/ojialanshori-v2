import { describe, expect, it } from 'vitest'
import {
  getRoleCluster,
  getRoleHomePath,
  isAdminRole,
  isDashboardRole,
} from '~/utils/roleRoute'

describe('utils/roleRoute', () => {
  it('maps admin to /admin home', () => {
    expect(getRoleHomePath('admin')).toBe('/admin')
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
    expect(getRoleCluster('admin')).toBe('admin')
    expect(getRoleCluster('reviewer')).toBe('dashboard')
    expect(getRoleCluster('santri')).toBe('dashboard')
  })

  it('exposes explicit admin and dashboard role guards', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('reviewer')).toBe(false)
    expect(isAdminRole('santri')).toBe(false)
    expect(isDashboardRole('reviewer')).toBe(true)
    expect(isDashboardRole('santri')).toBe(true)
    expect(isDashboardRole('admin')).toBe(false)
  })
})
