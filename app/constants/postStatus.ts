import type { PostStatus } from '~~/shared/types'

export const POST_STATUS_LABEL_MAP: Record<PostStatus, string> = {
  draft: 'Draft',
  pending_review: 'Dalam Ulasan',
  published: 'Terbit',
  rejected: 'Ditolak',
}

export const POST_STATUS_COLOR_MAP: Record<
  PostStatus,
  'success' | 'warning' | 'neutral' | 'error'
> = {
  draft: 'neutral',
  pending_review: 'warning',
  published: 'success',
  rejected: 'error',
}

export const POST_STATUS_OPTIONS = (Object.keys(POST_STATUS_LABEL_MAP) as PostStatus[]).map(
  (value) => ({ value, label: POST_STATUS_LABEL_MAP[value] }),
)
