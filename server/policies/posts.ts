import type { Role } from '#server/utils/guard'

export type PostType = 'berita' | 'pena_santri'

export function canCreatePost(role: Role, type: PostType): boolean {
  if (type === 'berita') return role === 'admin'
  return role === 'admin' || role === 'santri'
}

export function canEditPost(role: Role, type: PostType, authorId: number, actorId: number): boolean {
  if (type === 'berita') return role === 'admin'
  if (role === 'admin') return true
  return role === 'santri' && authorId === actorId
}

export function canDeletePost(role: Role, type: PostType, authorId: number, actorId: number): boolean {
  if (type === 'berita') return role === 'admin'
  if (role === 'admin') return true
  return role === 'santri' && authorId === actorId
}

export function canSubmitPost(role: Role, authorId: number, actorId: number): boolean {
  return role === 'santri' && authorId === actorId
}

export function canApprovePost(role: Role, type: PostType): boolean {
  if (type === 'berita') return role === 'admin'
  return role === 'admin' || role === 'reviewer'
}

export function canRejectPost(role: Role, type: PostType): boolean {
  return canApprovePost(role, type)
}

export function canPublishPost(role: Role, type: PostType): boolean {
  if (type === 'berita') return role === 'admin'
  return role === 'admin' || role === 'reviewer'
}

export function canViewPost(
  role: Role,
  type: PostType,
  authorId: number,
  actorId: number,
  status: string,
): boolean {
  if (role === 'admin') return true
  if (role === 'reviewer') return type === 'pena_santri'
  return role === 'santri' && authorId === actorId
}
