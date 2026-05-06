export type AppRole = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'
export type AppCluster = 'admin' | 'dashboard'

const ADMIN_ROLES: AppRole[] = ['superadmin', 'pengurus']
const DASHBOARD_ROLES: AppRole[] = ['reviewer', 'santri']

export function isAdminRole(role: string | undefined): role is AppRole {
  return ADMIN_ROLES.includes(role as AppRole)
}

export function isDashboardRole(role: string | undefined): role is AppRole {
  return DASHBOARD_ROLES.includes(role as AppRole)
}

export function getRoleCluster(role: string | undefined): AppCluster {
  return isAdminRole(role) ? 'admin' : 'dashboard'
}

export function getRoleHomePath(role: string | undefined): '/admin' | '/dashboard' {
  return getRoleCluster(role) === 'admin' ? '/admin' : '/dashboard'
}

export function getRoleProfilePath(role: string | undefined): '/admin/profile' | '/dashboard/profile' {
  return getRoleCluster(role) === 'admin' ? '/admin/profile' : '/dashboard/profile'
}
