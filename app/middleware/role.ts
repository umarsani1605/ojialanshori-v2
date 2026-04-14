type Role = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'

const ROLE_HIERARCHY: Record<string, Role[]> = {
  all: ['superadmin', 'pengurus', 'reviewer', 'santri'],
  reviewer: ['superadmin', 'pengurus', 'reviewer'],
  admin: ['superadmin', 'pengurus'],
  superadmin: ['superadmin'],
}

export function checkAccess(userRole: string | undefined, requiredRole: string): boolean {
  if (!userRole) return false
  const allowed = ROLE_HIERARCHY[requiredRole]
  return allowed?.includes(userRole as Role) ?? false
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  // Kalau belum login, biarkan middleware/auth.ts yang handle
  if (!auth.loggedIn.value) return

  const requiredRole = (to.meta.requiredRole as string) ?? 'all'
  const allowed = checkAccess(auth.user.value?.role, requiredRole)
  if (!allowed) return navigateTo('/dashboard')
})
