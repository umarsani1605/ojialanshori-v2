import type { H3Event } from 'h3'

import { and, count, desc, eq, inArray } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import type { CategoryType } from '#server/db/schema'

type PublicPostSort = 'latest'

type PublicPostListOptions = {
  author?: string
  category?: string
  limit?: number
  page?: number
  sort?: string
  subcategory?: string
  type: CategoryType
}

type CategoryRecord = {
  id: number
  parentId: number | null
  slug: string
  type: CategoryType
}

type ResolvedCategoryFilters = {
  categoryIds: number[] | null
  requestedCategorySlug: string | null
  requestedSubcategorySlug: string | null
}

export function normalizePublicPostListingOptions(options: PublicPostListOptions) {
  return {
    type: options.type,
    category: normalizeOptionalString(options.category),
    subcategory: normalizeOptionalString(options.subcategory),
    author: normalizeOptionalString(options.author),
    page: Math.max(1, options.page ?? 1),
    limit: Math.min(24, Math.max(1, options.limit ?? 9)),
    sort: normalizeSort(options.sort),
  } as const
}

export function resolveCategoryFilters(options: {
  categories: CategoryRecord[]
  category?: string | null
  subcategory?: string | null
  type: CategoryType
}): ResolvedCategoryFilters {
  const categories = options.categories.filter(category => category.type === options.type)
  const bySlug = new Map(categories.map(category => [category.slug, category]))

  const categorySlug = normalizeOptionalString(options.category) ?? null
  const subcategorySlug = normalizeOptionalString(options.subcategory) ?? null

  if (!categorySlug && !subcategorySlug) {
    return {
      categoryIds: null,
      requestedCategorySlug: null,
      requestedSubcategorySlug: null,
    }
  }

  const selectedCategory = categorySlug ? bySlug.get(categorySlug) : undefined
  if (categorySlug && !selectedCategory) {
    throw createError({
      statusCode: 400,
      statusMessage: `Category "${categorySlug}" was not found.`,
    })
  }

  const selectedSubcategory = subcategorySlug ? bySlug.get(subcategorySlug) : undefined
  if (subcategorySlug && !selectedSubcategory) {
    throw createError({
      statusCode: 400,
      statusMessage: `Subcategory "${subcategorySlug}" was not found.`,
    })
  }

  if (selectedSubcategory && selectedSubcategory.parentId === null) {
    throw createError({
      statusCode: 400,
      statusMessage: `Subcategory "${subcategorySlug}" was not found.`,
    })
  }

  if (selectedCategory && selectedSubcategory) {
    const selectedCategoryChildren = categories
      .filter(category => category.parentId === selectedCategory.id)
      .map(category => category.id)

    if (selectedCategory.parentId === null) {
      if (!selectedCategoryChildren.includes(selectedSubcategory.id)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Query parameter "subcategory" must belong to the requested "category".',
        })
      }
    }
    else if (selectedCategory.id !== selectedSubcategory.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Query parameter "subcategory" must belong to the requested "category".',
      })
    }
  }

  if (selectedSubcategory) {
    return {
      categoryIds: [selectedSubcategory.id],
      requestedCategorySlug: categorySlug,
      requestedSubcategorySlug: subcategorySlug,
    }
  }

  if (!selectedCategory) {
    return {
      categoryIds: null,
      requestedCategorySlug: null,
      requestedSubcategorySlug: null,
    }
  }

  if (selectedCategory.parentId === null) {
    const childIds = categories
      .filter(category => category.parentId === selectedCategory.id)
      .map(category => category.id)

    return {
      categoryIds: [selectedCategory.id, ...childIds],
      requestedCategorySlug: selectedCategory.slug,
      requestedSubcategorySlug: null,
    }
  }

  return {
    categoryIds: [selectedCategory.id],
    requestedCategorySlug: selectedCategory.slug,
    requestedSubcategorySlug: null,
  }
}

export async function getPublicPostListing(event: H3Event, options: PublicPostListOptions) {
  if (!isMysqlConfigured(event)) {
    throw createDatabaseNotConfiguredError()
  }

  const normalized = normalizePublicPostListingOptions(options)
  const offset = (normalized.page - 1) * normalized.limit

  const db = useDb(event)

  const categoryRows = await db.select({
    id: schema.categories.id,
    parentId: schema.categories.parentId,
    slug: schema.categories.slug,
    type: schema.categories.type,
  })
    .from(schema.categories)
    .where(eq(schema.categories.type, normalized.type))

  const resolvedCategoryFilters = resolveCategoryFilters({
    type: normalized.type,
    category: normalized.category,
    subcategory: normalized.subcategory,
    categories: categoryRows,
  })

  const conditions = [
    eq(schema.posts.status, 'published' as const),
    eq(schema.categories.type, normalized.type),
  ]

  if (resolvedCategoryFilters.categoryIds?.length) {
    conditions.push(inArray(schema.posts.categoryId, resolvedCategoryFilters.categoryIds))
  }

  if (normalized.author) {
    conditions.push(eq(schema.users.username, normalized.author))
  }

  const where = and(...conditions)

  const [rows, totalResult] = await Promise.all([
    db.select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
      featuredImage: schema.posts.featuredImage,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      categoryId: schema.categories.id,
      categorySlug: schema.categories.slug,
      categoryName: schema.categories.name,
      authorName: schema.users.name,
      authorUsername: schema.users.username,
    })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
      .limit(normalized.limit)
      .offset(offset),
    db.select({ count: count() })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(where),
  ])

  const categoriesById = new Map(categoryRows.map(category => [category.id, category]))
  const total = totalResult[0]?.count ?? 0

  return {
    data: rows.map((row) => {
      const category = categoriesById.get(row.categoryId)
      const parentSlug = category?.parentId
        ? categoriesById.get(category.parentId)?.slug ?? null
        : null

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        featuredImage: row.featuredImage,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        categorySlug: row.categorySlug,
        categoryName: row.categoryName,
        categoryParentSlug: parentSlug,
        authorName: row.authorName,
        authorUsername: row.authorUsername,
      }
    }),
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / normalized.limit)),
    },
  }
}

function normalizeOptionalString(value?: string | null) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeSort(sort?: string): PublicPostSort {
  if (sort === 'latest') {
    return sort
  }

  return 'latest'
}
