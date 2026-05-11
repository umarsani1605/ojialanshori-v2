import type { Role } from '~~/shared/types'

export function canManageUsers(role: Role): boolean {
  return role === 'admin'
}

export function canResetPassword(role: Role): boolean {
  return role === 'admin'
}

export function canChangeUserRole(role: Role): boolean {
  return role === 'admin'
}
