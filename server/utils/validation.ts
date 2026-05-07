import { createError } from 'h3'

import type { CategoryType, PageStatus, PostStatus, Role } from '#server/db/schema'
import { parseSantriPostPayload } from '#server/utils/santriPostEditor'

const VALID_ROLES: Role[] = ['admin', 'reviewer', 'santri']
const VALID_USER_STATUSES = ['active', 'inactive'] as const
const VALID_PUBLIC_POST_TYPES = ['berita', 'pena_santri'] as const
const VALID_SANTRI_POST_STATUSES = ['draft', 'pending_review', 'published', 'rejected'] as const satisfies PostStatus[]
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type UserUpdateInput = {
  email?: string
  isActive?: boolean
  name?: string
  role?: Role
  username?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getSingleValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function getOptionalString(value: unknown) {
  const singleValue = getSingleValue(value)

  if (typeof singleValue !== 'string') {
    return undefined
  }

  const normalized = singleValue.trim()
  return normalized.length > 0 ? normalized : undefined
}

function getPositiveInteger(value: unknown, fallback: number, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const singleValue = getSingleValue(value)
  const parsed = typeof singleValue === 'number' ? singleValue : Number(singleValue)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function getRequiredRecord(value: unknown, message = 'Payload tidak valid.') {
  if (!isRecord(value)) {
    throw createError({ statusCode: 400, message })
  }

  return value
}

export function validateRouteIdParams(value: unknown) {
  const params = getRequiredRecord(value, 'Parameter route tidak valid.')
  const rawId = getSingleValue(params.id)
  const id = typeof rawId === 'number' ? rawId : Number(rawId)

  return { id }
}

export function validateSlugParams(value: unknown) {
  const params = getRequiredRecord(value, 'Parameter route tidak valid.')
  const slug = getOptionalString(params.slug)

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug diperlukan.' })
  }

  return { slug }
}

export function validatePublicPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const type = getOptionalString(query.type)

  if (!type || !VALID_PUBLIC_POST_TYPES.includes(type as (typeof VALID_PUBLIC_POST_TYPES)[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameter "type" must be "berita" or "pena_santri".',
    })
  }

  return {
    type: type as CategoryType,
    category: getOptionalString(query.category),
    subcategory: getOptionalString(query.subcategory),
    author: getOptionalString(query.author),
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 9),
    sort: getOptionalString(query.sort),
  }
}

export function validateDashboardUsersQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const role = getOptionalString(query.role)
  const status = getOptionalString(query.status)

  return {
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 20, { max: 100 }),
    role: role && VALID_ROLES.includes(role as Role) ? role as Role : undefined,
    status: status && VALID_USER_STATUSES.includes(status as (typeof VALID_USER_STATUSES)[number])
      ? status as (typeof VALID_USER_STATUSES)[number]
      : undefined,
    search: getOptionalString(query.search) ?? '',
  }
}

export function validateDashboardUserCreateBody(value: unknown) {
  const body = getRequiredRecord(value)
  const name = getOptionalString(body.name)
  const username = getOptionalString(body.username)
  const email = getOptionalString(body.email)?.toLowerCase()
  const role = getOptionalString(body.role)
  const password = getOptionalString(body.password)

  if (!name || !username || !email || !role || !password) {
    throw createError({ statusCode: 400, message: 'Semua field wajib diisi.' })
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError({ statusCode: 400, message: 'Format email tidak valid.' })
  }

  if (!VALID_ROLES.includes(role as Role)) {
    throw createError({ statusCode: 400, message: 'Role tidak valid.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password minimal 8 karakter.' })
  }

  return {
    name,
    username,
    email,
    role: role as Role,
    password,
  }
}

export function validateDashboardUserUpdateBody(value: unknown): UserUpdateInput {
  const body = getRequiredRecord(value)
  const updates: UserUpdateInput = {}

  if ('name' in body) {
    const name = getOptionalString(body.name)

    if (!name) {
      throw createError({ statusCode: 400, message: 'Nama tidak boleh kosong.' })
    }

    updates.name = name
  }

  if ('username' in body) {
    const username = getOptionalString(body.username)

    if (!username) {
      throw createError({ statusCode: 400, message: 'Username tidak boleh kosong.' })
    }

    updates.username = username
  }

  if ('email' in body) {
    const email = getOptionalString(body.email)?.toLowerCase()

    if (!email || !EMAIL_REGEX.test(email)) {
      throw createError({ statusCode: 400, message: 'Format email tidak valid.' })
    }

    updates.email = email
  }

  if ('role' in body) {
    const role = getOptionalString(body.role)

    if (!role || !VALID_ROLES.includes(role as Role)) {
      throw createError({ statusCode: 400, message: 'Role tidak valid.' })
    }

    updates.role = role as Role
  }

  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Status aktif tidak valid.' })
    }

    updates.isActive = body.isActive
  }

  return updates
}

export function validateLoginBody(value: unknown) {
  const body = getRequiredRecord(value)
  const identifier = getOptionalString(body.identifier)
  const password = getOptionalString(body.password)

  if (!identifier || !password) {
    throw createError({ statusCode: 400, message: 'Identifier dan password wajib diisi.' })
  }

  if ('remember' in body && typeof body.remember !== 'boolean' && body.remember !== undefined) {
    throw createError({ statusCode: 400, message: 'Nilai remember tidak valid.' })
  }

  return {
    identifier,
    password,
    remember: body.remember === true,
  }
}

export function validateSantriPostBody(value: unknown) {
  return parseSantriPostPayload(value)
}

export function validateSantriPostListQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const status = getOptionalString(query.status)

  return {
    status: status && VALID_SANTRI_POST_STATUSES.includes(status as PostStatus)
      ? status as PostStatus
      : undefined,
  }
}

export function validateRejectBody(value: unknown) {
  const body = getRequiredRecord(value)
  const reviewNote = getOptionalString(body.reviewNote)

  if (!reviewNote) {
    throw createError({ statusCode: 400, message: 'Catatan review wajib diisi saat menolak artikel.' })
  }

  return { reviewNote }
}

export function validateReviewQueueQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')

  return {
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 10, { max: 50 }),
  }
}

export function validateAdminPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, 'Query tidak valid.')
  const status = getOptionalString(query.status)

  return {
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 10, { max: 100 }),
    status: status && VALID_SANTRI_POST_STATUSES.includes(status as PostStatus)
      ? status as PostStatus
      : undefined,
  }
}

export function validateAdminBannerBody(value: unknown) {
  const body = getRequiredRecord(value)
  const text = getOptionalString(body.text)

  if (!text) {
    throw createError({ statusCode: 400, message: 'Teks banner wajib diisi.' })
  }

  if (text.length > 500) {
    throw createError({ statusCode: 400, message: 'Teks banner maksimal 500 karakter.' })
  }

  const link = getOptionalString(body.link)

  let isActive: boolean | undefined
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Nilai isActive tidak valid.' })
    }
    isActive = body.isActive
  }

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
  const startDate = getOptionalString(body.startDate)
  const endDate = getOptionalString(body.endDate)

  if (startDate && !DATE_REGEX.test(startDate)) {
    throw createError({ statusCode: 400, message: 'Format startDate tidak valid (YYYY-MM-DD).' })
  }

  if (endDate && !DATE_REGEX.test(endDate)) {
    throw createError({ statusCode: 400, message: 'Format endDate tidak valid (YYYY-MM-DD).' })
  }

  return { text, link, isActive, startDate: startDate ?? null, endDate: endDate ?? null }
}

export function validateAdminSettingsUpdateBody(value: unknown) {
  const body = getRequiredRecord(value)

  if (!isRecord(body.updates)) {
    throw createError({ statusCode: 400, message: 'Field updates harus berupa objek.' })
  }

  const entries = Object.entries(body.updates)

  if (entries.length > 50) {
    throw createError({ statusCode: 400, message: 'Maksimal 50 setting sekaligus.' })
  }

  for (const [k, v] of entries) {
    if (typeof k !== 'string' || typeof v !== 'string') {
      throw createError({ statusCode: 400, message: 'Setiap key dan value harus berupa string.' })
    }
  }

  return { updates: body.updates as Record<string, string> }
}

const VALID_CATEGORY_TYPES = ['berita', 'pena_santri'] as const satisfies CategoryType[]

export function validateAdminCategoryBody(value: unknown) {
  const body = getRequiredRecord(value)
  const name = getOptionalString(body.name)

  if (!name) {
    throw createError({ statusCode: 400, message: 'Nama kategori wajib diisi.' })
  }

  const slug = getOptionalString(body.slug)
  const type = getOptionalString(body.type)

  if (!type || !VALID_CATEGORY_TYPES.includes(type as CategoryType)) {
    throw createError({ statusCode: 400, message: 'Tipe kategori tidak valid (berita atau pena_santri).' })
  }

  let parentId: number | null = null
  if ('parentId' in body && body.parentId !== null && body.parentId !== undefined) {
    const raw = getSingleValue(body.parentId)
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw createError({ statusCode: 400, message: 'parentId tidak valid.' })
    }
    parentId = parsed
  }

  return { name, slug: slug ?? null, type: type as CategoryType, parentId }
}

export function validateAdminGalleryBody(value: unknown) {
  const body = getRequiredRecord(value)
  const title = getOptionalString(body.title)

  if (!title) {
    throw createError({ statusCode: 400, message: 'Judul gambar wajib diisi.' })
  }

  const imagePath = getOptionalString(body.imagePath)

  if (!imagePath) {
    throw createError({ statusCode: 400, message: 'Path gambar wajib diisi.' })
  }

  const album = getOptionalString(body.album)
  const order = 'order' in body ? getPositiveInteger(body.order, 0, { min: 0 }) : 0

  return { title, imagePath, album: album ?? null, order }
}

const VALID_PAGE_STATUSES = ['draft', 'published'] as const satisfies PageStatus[]

export function validateAdminPageBody(value: unknown) {
  const body = getRequiredRecord(value)
  const title = getOptionalString(body.title)

  if (!title) {
    throw createError({ statusCode: 400, message: 'Judul halaman wajib diisi.' })
  }

  const slug = getOptionalString(body.slug)

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug halaman wajib diisi.' })
  }

  const content = typeof body.content === 'string' ? body.content : ''
  const statusRaw = getOptionalString(body.status)
  const status: PageStatus = statusRaw && VALID_PAGE_STATUSES.includes(statusRaw as PageStatus)
    ? (statusRaw as PageStatus)
    : 'draft'

  return { title, slug, content, status }
}
