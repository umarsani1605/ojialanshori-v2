import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import {
  requireRole,
  requireAuth,
  requireReviewer,
  requireAdmin,
  requireSuperadmin,
} from '@@/server/utils/guard'

function makeEvent(user: { id: number, name: string, role: string } | null): H3Event {
  return { context: user ? { user } : {} } as unknown as H3Event
}

describe('requireRole', () => {
  it('throw 401 jika tidak ada session (user undefined)', () => {
    expect(() => requireRole(makeEvent(null), ['superadmin'])).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    )
  })

  it('throw 403 jika role tidak ada dalam allowed roles', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'santri' })
    expect(() => requireRole(event, ['superadmin'])).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('tidak throw jika role sesuai', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'superadmin' })
    expect(() => requireRole(event, ['superadmin'])).not.toThrow()
    const user = requireRole(event, ['superadmin'])
    expect(user.role).toBe('superadmin')
  })
})

describe('shorthand guards', () => {
  it('requireSuperadmin — throw 403 untuk pengurus', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'pengurus' })
    expect(() => requireSuperadmin(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireAdmin — throw 403 untuk reviewer', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'reviewer' })
    expect(() => requireAdmin(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireReviewer — throw 403 untuk santri', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'santri' })
    expect(() => requireReviewer(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireAuth — tidak throw untuk semua role yang login', () => {
    for (const role of ['superadmin', 'pengurus', 'reviewer', 'santri']) {
      const event = makeEvent({ id: 1, name: 'Test', role })
      expect(() => requireAuth(event)).not.toThrow()
    }
  })

  it('requireAuth — throw 401 jika tidak ada session', () => {
    expect(() => requireAuth(makeEvent(null))).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    )
  })
})
