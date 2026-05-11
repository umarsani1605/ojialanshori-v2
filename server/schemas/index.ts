/**
 * Validation schemas untuk request body.
 *
 * Lingkup validasi: hanya tipe dasar + required/optional + enum.
 * TIDAK validasi spesifik (min/max length, regex, range angka).
 * Constraint detail tetap di DB schema (length, NOT NULL, dll).
 */

import { z } from 'zod'

// ──────────────────────────────────────────────────────────────────
// Enum sources (sinkron dgn schema.ts)
// ──────────────────────────────────────────────────────────────────

export const roleSchema = z.enum(['admin', 'reviewer', 'santri'])
export const postStatusSchema = z.enum(['draft', 'pending_review', 'published', 'rejected'])
export const categoryTypeSchema = z.enum(['berita', 'pena_santri'])

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

const nullableString = () => z.string().nullable().optional()
const nullableNumber = () => z.number().nullable().optional()

// ──────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
})

export const registerSchema = z.object({
  fullname: z.string(),
  email: z.string(),
  password: z.string(),
})

// ──────────────────────────────────────────────────────────────────
// User
// ──────────────────────────────────────────────────────────────────

const userBase = {
  fullname: z.string(),
  nickname: nullableString(),
  bio: nullableString(),
  email: z.string(),
  role: roleSchema,
  avatar: nullableString(),
  phone: nullableString(),
  yearEnrolled: z.union([z.string(), z.number(), z.null()]).optional(),
  yearStudy: z.union([z.string(), z.number(), z.null()]).optional(),
  university: nullableString(),
  faculty: nullableString(),
  major: nullableString(),
  isActive: z.boolean(),
}

export const createUserSchema = z.object({
  ...userBase,
  password: z.string(),
})

export const updateUserSchema = z.object(userBase).partial()

// ──────────────────────────────────────────────────────────────────
// Profile (self-update)
// ──────────────────────────────────────────────────────────────────

const optionalYear = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  })

export const updateProfileSchema = z.object({
  fullname: z.string().optional(),
  nickname: nullableString(),
  bio: nullableString(),
  phone: nullableString(),
  university: nullableString(),
  faculty: nullableString(),
  major: nullableString(),
  yearEnrolled: optionalYear,
  yearStudy: optionalYear,
})

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
})

// ──────────────────────────────────────────────────────────────────
// Category
// ──────────────────────────────────────────────────────────────────

export const upsertCategorySchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  parentId: nullableNumber(),
  type: categoryTypeSchema.optional(),
})

// ──────────────────────────────────────────────────────────────────
// Post
// ──────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  content: z.string(),
  excerpt: nullableString(),
  featuredImage: nullableString(),
  categoryId: nullableNumber(),
  status: postStatusSchema.optional(),
})

export const updatePostSchema = createPostSchema.partial()

export const reviewPostSchema = z.object({
  reviewNote: z.string().nullable().optional(),
})

// ──────────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────────

export const upsertFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  order: z.number().optional(),
})

export const updateFaqSchema = upsertFaqSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Activity
// ──────────────────────────────────────────────────────────────────

export const upsertActivitySchema = z.object({
  title: z.string(),
  description: nullableString(),
  imagePath: z.string(),
  order: z.number().optional(),
})

export const updateActivitySchema = upsertActivitySchema.partial()

// ──────────────────────────────────────────────────────────────────
// Board Member
// ──────────────────────────────────────────────────────────────────

export const upsertBoardMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatarPath: nullableString(),
  order: z.number().optional(),
})

export const updateBoardMemberSchema = upsertBoardMemberSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Gallery
// ──────────────────────────────────────────────────────────────────

export const createGallerySchema = z.object({
  title: z.string(),
  imagePath: z.string(),
  order: z.number().optional(),
})

export const updateGallerySchema = z.object({
  title: z.string().optional(),
  order: z.number().optional(),
})

// ──────────────────────────────────────────────────────────────────
// Testimonial
// ──────────────────────────────────────────────────────────────────

export const upsertTestimonialSchema = z.object({
  name: z.string(),
  title: z.string(),
  content: z.string(),
  avatarPath: nullableString(),
  order: z.number().optional(),
})

export const updateTestimonialSchema = upsertTestimonialSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Banner
// ──────────────────────────────────────────────────────────────────

export const upsertBannerSchema = z.object({
  text: z.string(),
  link: nullableString(),
  isActive: z.boolean().optional(),
  startDate: nullableString(),
  endDate: nullableString(),
})

// ──────────────────────────────────────────────────────────────────
// Settings (batch update)
// ──────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  updates: z.record(z.string(), z.string()),
})

// ──────────────────────────────────────────────────────────────────
// Pages (template meta)
// ──────────────────────────────────────────────────────────────────

export const updatePageSchema = z.object({
  title: z.string().optional(),
  meta: z.record(z.string(), z.any()),
})
