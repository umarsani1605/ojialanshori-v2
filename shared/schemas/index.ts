/**
 * Validation schemas untuk request body & query.
 *
 * Lingkup validasi: tipe + required/optional + enum + transform/coerce.
 * Pesan error pakai Bahasa Indonesia agar UX konsisten.
 */

import { z } from 'zod'

// ──────────────────────────────────────────────────────────────────
// Enum sources (sinkron dgn schema.ts)
// ──────────────────────────────────────────────────────────────────

export const roleSchema = z.enum(['admin', 'reviewer', 'santri'])
export const postStatusSchema = z.enum(['draft', 'pending_review', 'published', 'rejected'])
export const categoryTypeSchema = z.enum(['berita', 'pena_santri'])
export const pageStatusSchema = z.enum(['draft', 'published'])

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

// Field opsional bertipe nullable. `undefined` di body diperlakukan sebagai `null`.
const nullableString = () =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : v))
const nullableNumber = () =>
  z
    .union([z.number(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : v))

const optionalYear = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null || v === '') return null
    const n = Number(v)
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null
    if (n < 1901 || n > 2155) return null
    return n
  })

const emailSchema = z
  .string({ message: 'Email wajib diisi.' })
  .email('Format email tidak valid.')
  .transform((s) => s.toLowerCase())

const passwordSchema = z
  .string({ message: 'Password wajib diisi.' })
  .min(8, 'Password minimal 8 karakter.')

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')

// ──────────────────────────────────────────────────────────────────
// Route params
// ──────────────────────────────────────────────────────────────────

export const routeIdSchema = z.coerce.number().int().positive('Id route tidak valid.')
export const routeSlugSchema = z.string().min(1, 'Slug diperlukan.')

// ──────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
  remember: z.boolean().optional().default(false),
})

export const registerSchema = z
  .object({
    fullname: z.string().min(1, 'Nama wajib diisi.'),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string({ message: 'Konfirmasi password wajib diisi.' }),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['passwordConfirmation'],
  })

// ──────────────────────────────────────────────────────────────────
// User (admin CRUD)
// ──────────────────────────────────────────────────────────────────

const userBase = {
  fullname: z.string().min(1, 'Nama wajib diisi.'),
  nickname: nullableString(),
  bio: nullableString(),
  email: emailSchema,
  role: roleSchema,
  avatar: nullableString(),
  phone: nullableString(),
  yearEnrolled: optionalYear,
  yearStudy: optionalYear,
  university: nullableString(),
  faculty: nullableString(),
  major: nullableString(),
  isActive: z.boolean().optional().default(true),
}

export const createUserSchema = z.object({
  ...userBase,
  password: passwordSchema,
})

export const updateUserSchema = z.object(userBase).partial()

export const adminUsersQuerySchema = z.object({
  role: roleSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
  phone: z.string().optional(),
  university: z.string().optional(),
  yearEnrolled: z.coerce.number().int().min(1901).max(2155).optional(),
  yearStudy: z.coerce.number().int().min(1901).max(2155).optional(),
})

// ──────────────────────────────────────────────────────────────────
// Profile (self)
// ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  fullname: z.string().min(1).optional(),
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
  oldPassword: z.string({ message: 'Password lama wajib diisi.' }),
  newPassword: passwordSchema,
  confirmPassword: z.string({ message: 'Konfirmasi password wajib diisi.' }),
})

// ──────────────────────────────────────────────────────────────────
// Post (santri write + admin review)
// ──────────────────────────────────────────────────────────────────

/**
 * Schema input mentah untuk santri write/review.
 * Transform detail (trim title, slugify, sanitize tags) dilakukan
 * oleh `parseSantriPostPayload` di server/utils/santriPostEditor.ts.
 */
export const santriPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: nullableString(),
  featuredImage: nullableString(),
  categoryId: nullableNumber(),
  tags: z.array(z.string()).optional(),
})

export const reviewActionSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: nullableString().optional(),
  categoryId: z
    .union([z.number(), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined)),
  featuredImage: nullableString().optional(),
  tags: z.array(z.string()).optional(),
})

export const rejectWithContentSchema = reviewActionSchema.extend({
  reviewNote: z
    .string({ message: 'Catatan review wajib diisi saat menolak artikel.' })
    .min(1, 'Catatan review wajib diisi saat menolak artikel.'),
})

export const adminPostsQuerySchema = z.object({
  status: postStatusSchema.optional(),
})

export const publicPostsQuerySchema = z.object({
  type: categoryTypeSchema,
  category: z.string().optional(),
  subcategory: z.string().optional(),
  author: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(24).optional().default(9),
})

// ──────────────────────────────────────────────────────────────────
// Category
// ──────────────────────────────────────────────────────────────────

export const upsertCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi.'),
})

// ──────────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────────

export const upsertFaqSchema = z.object({
  question: z.string().min(1, 'Pertanyaan wajib diisi.'),
  answer: z.string().min(1, 'Jawaban wajib diisi.'),
  order: z.number().optional(),
})

export const updateFaqSchema = upsertFaqSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Activity
// ──────────────────────────────────────────────────────────────────

export const upsertActivitySchema = z.object({
  title: z.string().min(1, 'Judul kegiatan wajib diisi.'),
  description: nullableString(),
  imagePath: z.string().min(1, 'Path gambar wajib diisi.'),
  order: z.number().optional(),
})

export const updateActivitySchema = upsertActivitySchema.partial()

// ──────────────────────────────────────────────────────────────────
// Board Member
// ──────────────────────────────────────────────────────────────────

export const upsertBoardMemberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  role: z.string().min(1, 'Peran wajib diisi.'),
  avatarPath: nullableString(),
  order: z.number().optional(),
})

export const updateBoardMemberSchema = upsertBoardMemberSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Gallery
// ──────────────────────────────────────────────────────────────────

export const createGallerySchema = z.object({
  title: z.string().min(1, 'Judul gambar wajib diisi.'),
  imagePath: z.string().min(1, 'Path gambar wajib diisi.'),
  order: z.coerce.number().int().positive().optional(),
})

export const updateGallerySchema = z.object({
  title: z.string().min(1).optional(),
  order: z.coerce.number().int().positive().optional(),
})

// ──────────────────────────────────────────────────────────────────
// Testimonial
// ──────────────────────────────────────────────────────────────────

export const upsertTestimonialSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  title: z.string().min(1, 'Judul wajib diisi.'),
  content: z.string().min(1, 'Isi testimonial wajib diisi.'),
  avatarPath: nullableString(),
  order: z.number().optional(),
})

export const updateTestimonialSchema = upsertTestimonialSchema.partial()

// ──────────────────────────────────────────────────────────────────
// Banner
// ──────────────────────────────────────────────────────────────────

export const upsertBannerSchema = z.object({
  text: z
    .string()
    .min(1, 'Teks banner wajib diisi.')
    .max(500, 'Teks banner maksimal 500 karakter.'),
  link: nullableString(),
  isActive: z.boolean().optional(),
  startDate: dateStringSchema.nullable().optional(),
  endDate: dateStringSchema.nullable().optional(),
})

// ──────────────────────────────────────────────────────────────────
// Settings (batch update)
// ──────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  updates: z
    .record(z.string(), z.string())
    .refine((r) => Object.keys(r).length <= 50, 'Maksimal 50 setting sekaligus.'),
})

// ──────────────────────────────────────────────────────────────────
// Pages
// ──────────────────────────────────────────────────────────────────

/** Untuk endpoint `/api/pages/[template].patch` (page-template editor) */
export const updatePageSchema = z.object({
  title: z.string().optional(),
  meta: z.record(z.string(), z.any()),
})
