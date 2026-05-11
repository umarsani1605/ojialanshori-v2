/**
 * Tipe yang client (page/komponen Vue) terima dari API.
 * Tanggal di sini selalu string ISO (hasil JSON serialization), bukan Date.
 * Tidak include kolom sensitif seperti password.
 */
import type { CategoryType, PostStatus, Role } from './db'

export type RoleFilter = Role | 'all'

export type SafeUser = {
  id: number
  fullname: string
  nickname: string | null
  email: string
  role: Role
  avatar: string | null
  bio: string | null
  phone: string | null
  university: string | null
  faculty: string | null
  major: string | null
  yearStudy: number | null
  yearEnrolled: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AdminPost = {
  id: number
  title: string
  slug: string
  featuredImage: string | null
  status: PostStatus
  updatedAt: string
  publishedAt: string | null
  author: { id: number; fullname: string }
  category: { id: number; name: string; type: CategoryType } | null
}

export type PublicPostListItem = {
  id: number
  title: string
  slug: string
  featuredImage: string | null
  publishedAt: string | null
  createdAt: string
  categoryName: string
  categoryType: CategoryType
  authorName: string
}

export type SantriMyPost = {
  id: number
  title: string
  slug: string
  status: PostStatus
  publishedAt: string | null
  createdAt: string
  categoryName: string | null
}

export type AdminDashboardStats = {
  type: 'global'
  totalPosts: number
  publishedPosts: number
  pendingReviewPosts: number
  totalSantri: number
  totalGallery: number
  recentPendingPosts: Array<{
    id: number
    title: string
    slug: string
    featuredImage: string | null
    createdAt: string
    author: { fullname: string }
  }>
}

export type SantriDashboardStats = {
  total: number
  published: number
  pendingReview: number
  rejected: number
  queueCount?: number
  latestApprovedPost:
    | {
        id: number
        title: string
        slug: string
        publishedAt: string | null
        categoryType: CategoryType
      }
    | null
}

// Entity shapes seperti yang dikirim API ke client (dates sebagai string ISO).

export type CategoryDto = {
  id: number
  name: string
  slug: string
  parentId: number | null
  type: CategoryType
}

export type ActivityDto = {
  id: number
  title: string
  description: string | null
  imagePath: string
  order: number
  createdAt: string
}

export type BoardMemberDto = {
  id: number
  name: string
  role: string
  avatarPath: string | null
  order: number
  createdAt: string
}

export type GalleryItemDto = {
  id: number
  title: string
  imagePath: string
  order: number
  createdAt: string
}

export type TestimonialDto = {
  id: number
  name: string
  title: string
  content: string
  avatarPath: string | null
  order: number
  createdAt: string
}

export type FaqDto = {
  id: number
  question: string
  answer: string
  order: number
  createdAt: string
  updatedAt: string
}

export type BannerDto = {
  id: number
  text: string
  link: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export type SettingDto = {
  key: string
  value: string
  updatedAt: string
}

export type ApiList<T> = { data: T[] }
export type ApiItem<T> = { data: T }
