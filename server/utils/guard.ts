import { createError, type H3Event } from 'h3'
import type { Role } from '~~/shared/types'

type SessionUser = {
  id: number
  fullname: string
  nickname?: string | null
  email: string
  role: Role
  avatar?: string | null
}

export function requireRole(event: H3Event, roles: Role[]): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

export const requireAuth = (e: H3Event) =>
  requireRole(e, ['admin', 'reviewer', 'santri'])

export const requireReviewer = (e: H3Event) =>
  requireRole(e, ['admin', 'reviewer'])

export const requireAdmin = (e: H3Event) =>
  requireRole(e, ['admin'])
