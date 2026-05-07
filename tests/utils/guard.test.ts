import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import {
  requireRole,
  requireAuth,
  requireReviewer,
  requireAdmin,
} from '@@/server/utils/guard'

function makeEvent(user: { id: number, name: string, email?: string, role: string } | null): H3Event {
  return { context: user ? { user } : {} } as unknown as H3Event
}

describe('requireRole', () => {
  it('throws 401 when no session', () => {
    expect(() => requireRole(makeEvent(null), ['admin'])).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    )
  })

  it('throws 403 when role not in allowed list', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'santri' })
    expect(() => requireRole(event, ['admin'])).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('does not throw when role matches', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'admin' })
    const user = requireRole(event, ['admin'])
    expect(user.role).toBe('admin')
  })
})

describe('shorthand guards', () => {
  it('requireAdmin — throws 403 for reviewer', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'reviewer' })
    expect(() => requireAdmin(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireAdmin — throws 403 for santri', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'santri' })
    expect(() => requireAdmin(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireAdmin — allows admin', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'admin' })
    expect(() => requireAdmin(event)).not.toThrow()
  })

  it('requireReviewer — throws 403 for santri', () => {
    const event = makeEvent({ id: 1, name: 'Test', role: 'santri' })
    expect(() => requireReviewer(event)).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })

  it('requireReviewer — allows admin and reviewer', () => {
    for (const role of ['admin', 'reviewer']) {
      const event = makeEvent({ id: 1, name: 'Test', role })
      expect(() => requireReviewer(event)).not.toThrow()
    }
  })

  it('requireAuth — allows all valid roles', () => {
    for (const role of ['admin', 'reviewer', 'santri']) {
      const event = makeEvent({ id: 1, name: 'Test', role })
      expect(() => requireAuth(event)).not.toThrow()
    }
  })

  it('requireAuth — throws 401 when no session', () => {
    expect(() => requireAuth(makeEvent(null))).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    )
  })
})
