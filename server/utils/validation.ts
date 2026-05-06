import { createError } from 'h3'

import type { CategoryType, PostStatus, Role } from '#server/db/schema'
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
