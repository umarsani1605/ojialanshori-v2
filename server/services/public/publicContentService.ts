import type { MySql2Database } from 'drizzle-orm/mysql2'

import type * as schema from '#server/db/schema'
import type { CategoryType } from '#server/db/schema'
import {
  getActiveBanner,
  getPublicFaqs,
  getPublicGallery,
  getPublicPostBySlug,
  getPublicPostListing,
  getPublicSettings,
  getPublicTestimonials,
} from '#server/repositories/public/publicContentRepository'

type Database = MySql2Database<typeof schema>

export type PublicPostListQuery = {
  type: CategoryType
  category?: string | null
  subcategory?: string | null
  author?: string | null
  page?: number
  limit?: number
}

export function getPublicActiveBanner(db: Database) {
  return getActiveBanner(db)
}

export function getPublicGalleryItems(db: Database) {
  return getPublicGallery(db)
}

export function getPublicSiteSettings(db: Database) {
  return getPublicSettings(db)
}

export function getPublicFaqList(db: Database) {
  return getPublicFaqs(db)
}

export function getPublicTestimonialList(db: Database) {
  return getPublicTestimonials(db)
}

export async function getPublicPost(db: Database, slug: string) {
  const post = await getPublicPostBySlug(db, slug)
  if (!post) {
    throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
  }
  return post
}

export function listPublicPosts(db: Database, query: PublicPostListQuery) {
  return getPublicPostListing(db, {
    type: query.type,
    category: query.category,
    subcategory: query.subcategory,
    author: query.author,
    page: Math.max(1, query.page ?? 1),
    limit: Math.min(24, Math.max(1, query.limit ?? 9)),
  })
}
