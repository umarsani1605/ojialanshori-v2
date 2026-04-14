export type RoleColor = 'error' | 'success' | 'warning' | 'primary'

export const roleLabelMap: Record<string, string> = {
  superadmin: 'Superadmin',
  pengurus: 'Pengurus',
  reviewer: 'Reviewer',
  santri: 'Santri',
}

export const roleColorMap: Record<string, RoleColor> = {
  superadmin: 'error',
  pengurus: 'success',
  reviewer: 'warning',
  santri: 'primary',
}
