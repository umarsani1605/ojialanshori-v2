export type RoleColor = 'error' | 'success' | 'warning' | 'primary'

export const roleLabelMap: Record<string, string> = {
  admin: 'Administrator',
  reviewer: 'Reviewer',
  santri: 'Santri',
}

export const roleColorMap: Record<string, RoleColor> = {
  admin: 'success',
  reviewer: 'warning',
  santri: 'primary',
}
