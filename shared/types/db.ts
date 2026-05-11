import type { InferSelectModel } from 'drizzle-orm'
import type {
  activities,
  banners,
  boardMembers,
  categories,
  faqs,
  gallery,
  pages,
  postTags,
  posts,
  settings,
  tags,
  testimonials,
  users,
} from '~~/server/db/schema'

export type {
  CategoryType,
  PageStatus,
  PasswordType,
  PostStatus,
  Role,
} from '~~/server/db/schema'

export type User = InferSelectModel<typeof users>
export type Category = InferSelectModel<typeof categories>
export type Post = InferSelectModel<typeof posts>
export type PageRow = InferSelectModel<typeof pages>
export type Activity = InferSelectModel<typeof activities>
export type BoardMember = InferSelectModel<typeof boardMembers>
export type GalleryItem = InferSelectModel<typeof gallery>
export type Banner = InferSelectModel<typeof banners>
export type Setting = InferSelectModel<typeof settings>
export type Testimonial = InferSelectModel<typeof testimonials>
export type Faq = InferSelectModel<typeof faqs>
export type Tag = InferSelectModel<typeof tags>
export type PostTag = InferSelectModel<typeof postTags>
