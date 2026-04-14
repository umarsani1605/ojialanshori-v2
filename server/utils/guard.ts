import { createError, type H3Event } from 'h3'

export type Role = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'

type SessionUser = { id: number, name: string, role: Role, avatarPath?: string | null }

export function requireRole(event: H3Event, roles: Role[]): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

export const requireAuth = (e: H3Event) =>
  requireRole(e, ['superadmin', 'pengurus', 'reviewer', 'santri'])

export const requireReviewer = (e: H3Event) =>
  requireRole(e, ['superadmin', 'pengurus', 'reviewer'])

export const requireAdmin = (e: H3Event) =>
  requireRole(e, ['superadmin', 'pengurus'])

export const requireSuperadmin = (e: H3Event) =>
  requireRole(e, ['superadmin'])
