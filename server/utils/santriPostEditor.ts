import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import type { CategoryType } from '~~/server/db/schema'
import * as schema from '~~/server/db/schema'

export type SantriEditorCategory = {
  id: number
  name: string
  type: CategoryType
}

export type SantriPostPayload = {
  title: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  categoryId: number | null
  postType: CategoryType | null
  tags: string[]
}

type Database = MySql2Database<typeof schema>

const ALLOWED_CATEGORY_TYPES = ['berita', 'pena_santri'] as const satisfies CategoryType[]
const DASHBOARD_EDITOR_CATEGORY_TYPE = 'pena_santri' as const satisfies CategoryType

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}

export function sanitizeTags(value: unknown) {
  const rawTags = Array.isArray(value) ? value : []

  return [...new Set(
    rawTags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 10),
  )]
}

export function parseSantriPostPayload(body: unknown): SantriPostPayload {
  if (!isRecord(body)) {
    throw createError({ statusCode: 400, message: 'Payload tidak valid.' })
  }

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
  const content = typeof body.content === 'string' ? body.content : ''
  const excerpt = typeof body.excerpt === 'string'
    ? body.excerpt.trim().slice(0, 200) || null
    : null
  const featuredImage = toNullableString(body.featuredImage)
  const categoryId = typeof body.categoryId === 'number' && Number.isInteger(body.categoryId)
    ? body.categoryId
    : null
  const postType = body.postType === 'berita' || body.postType === 'pena_santri'
    ? body.postType
    : null

  return {
    title,
    content,
    excerpt,
    featuredImage,
    categoryId,
    postType,
    tags: sanitizeTags(body.tags),
  }
}

export function assertDraftPayload(payload: SantriPostPayload) {
  if (!payload.title) {
    throw createError({ statusCode: 400, message: 'Judul post wajib diisi.' })
  }
}

export function assertSubmitPayload(payload: SantriPostPayload) {
  assertDraftPayload(payload)

  if (!payload.featuredImage) {
    throw createError({ statusCode: 400, message: 'Cover wajib diunggah sebelum dikirim untuk review.' })
  }

  if (!payload.categoryId) {
    throw createError({ statusCode: 400, message: 'Kategori wajib dipilih sebelum dikirim untuk review.' })
  }
}

export async function ensureCategoryExists(db: Database, categoryId: number | null) {
  if (!categoryId) {
    return
  }

  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
    columns: { id: true, type: true },
  })

  if (!category || !ALLOWED_CATEGORY_TYPES.includes(category.type)) {
    throw createError({ statusCode: 400, message: 'Kategori tidak valid.' })
  }
}

export async function getSantriEditorCategories(
  db: Database,
): Promise<SantriEditorCategory[]> {
  return db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      type: schema.categories.type,
    })
    .from(schema.categories)
    .where(eq(schema.categories.type, DASHBOARD_EDITOR_CATEGORY_TYPE))
    .orderBy(schema.categories.name)
}
