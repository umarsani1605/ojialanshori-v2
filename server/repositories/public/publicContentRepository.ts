import { and, count, desc, eq, inArray, type SQL } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from '#server/db/schema'
import type { CategoryType } from '#server/db/schema'

type Database = MySql2Database<typeof schema>

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

export type NormalizedListOptions = {
  type: CategoryType
  category?: string | null
  subcategory?: string | null
  author?: string | null
  page: number
  limit: number
}

export async function getPublicGallery(db: Database) {
  return db.select({
    id: schema.gallery.id,
    title: schema.gallery.title,
    imagePath: schema.gallery.imagePath,
    order: schema.gallery.order,
  })
    .from(schema.gallery)
    .orderBy(schema.gallery.order, schema.gallery.id)
    .limit(8)
}

export async function getPublicSettings(db: Database): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings)
  return Object.fromEntries(rows.map(row => [row.key, row.value]))
}

export async function getPublicFaqs(db: Database) {
  return db.select({
    question: schema.faqs.question,
    answer: schema.faqs.answer,
    order: schema.faqs.order,
  })
    .from(schema.faqs)
    .orderBy(schema.faqs.order, schema.faqs.id)
}

export async function getPublicTestimonials(db: Database) {
  return db.select({
    id: schema.testimonials.id,
    name: schema.testimonials.name,
    title: schema.testimonials.title,
    content: schema.testimonials.content,
    avatarPath: schema.testimonials.avatarPath,
    order: schema.testimonials.order,
  })
    .from(schema.testimonials)
    .orderBy(schema.testimonials.order, schema.testimonials.id)
}

export async function getPublicPostBySlug(db: Database, slug: string) {
  const rows = await db.select({
    id: schema.posts.id,
    title: schema.posts.title,
    slug: schema.posts.slug,
    content: schema.posts.content,
    excerpt: schema.posts.excerpt,
    featuredImage: schema.posts.featuredImage,
    publishedAt: schema.posts.publishedAt,
    createdAt: schema.posts.createdAt,
    categorySlug: schema.categories.slug,
    categoryName: schema.categories.name,
    categoryType: schema.categories.type,
    authorName: schema.users.fullname,
  })
    .from(schema.posts)
    .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .where(and(eq(schema.posts.slug, slug), eq(schema.posts.status, 'published')))
    .limit(1)

  return rows[0] ?? null
}

export async function getPublicPostListing(db: Database, options: NormalizedListOptions) {
  const offset = (options.page - 1) * options.limit

  const categoryRows = await db.select({
    id: schema.categories.id,
    parentId: schema.categories.parentId,
    slug: schema.categories.slug,
    type: schema.categories.type,
  })
    .from(schema.categories)
    .where(eq(schema.categories.type, options.type))

  const resolved = resolveCategoryFilters({
    type: options.type,
    category: options.category,
    subcategory: options.subcategory,
    categories: categoryRows,
  })

  const conditions = [
    eq(schema.posts.status, 'published' as const),
    eq(schema.categories.type, options.type),
  ]

  if (resolved.categoryIds?.length) {
    conditions.push(inArray(schema.posts.categoryId, resolved.categoryIds))
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
      authorName: schema.users.fullname,
    })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ count: count() })
      .from(schema.posts)
      .innerJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(where),
  ])

  const categoriesById = new Map(categoryRows.map(c => [c.id, c]))
  const total = totalResult[0]?.count ?? 0

  return {
    data: rows.map((row) => {
      const category = categoriesById.get(row.categoryId)
      const parentSlug = category?.parentId ? categoriesById.get(category.parentId)?.slug ?? null : null
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
      }
    }),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / options.limit)),
    },
  }
}

function resolveCategoryFilters(options: {
  categories: CategoryRecord[]
  category?: string | null
  subcategory?: string | null
  type: CategoryType
}): ResolvedCategoryFilters {
  const categories = options.categories.filter(c => c.type === options.type)
  const bySlug = new Map(categories.map(c => [c.slug, c]))

  const categorySlug = options.category?.trim() || null
  const subcategorySlug = options.subcategory?.trim() || null

  if (!categorySlug && !subcategorySlug) {
    return { categoryIds: null, requestedCategorySlug: null, requestedSubcategorySlug: null }
  }

  const selectedCategory = categorySlug ? bySlug.get(categorySlug) : undefined
  if (categorySlug && !selectedCategory) {
    throw createError({ statusCode: 400, statusMessage: `Category "${categorySlug}" was not found.` })
  }

  const selectedSubcategory = subcategorySlug ? bySlug.get(subcategorySlug) : undefined
  if (subcategorySlug && !selectedSubcategory) {
    throw createError({ statusCode: 400, statusMessage: `Subcategory "${subcategorySlug}" was not found.` })
  }

  if (selectedSubcategory && selectedSubcategory.parentId === null) {
    throw createError({ statusCode: 400, statusMessage: `Subcategory "${subcategorySlug}" was not found.` })
  }

  if (selectedCategory && selectedSubcategory) {
    const childIds = categories.filter(c => c.parentId === selectedCategory.id).map(c => c.id)
    if (selectedCategory.parentId === null) {
      if (!childIds.includes(selectedSubcategory.id)) {
        throw createError({ statusCode: 400, statusMessage: 'Query parameter "subcategory" must belong to the requested "category".' })
      }
    }
    else if (selectedCategory.id !== selectedSubcategory.id) {
      throw createError({ statusCode: 400, statusMessage: 'Query parameter "subcategory" must belong to the requested "category".' })
    }
  }

  if (selectedSubcategory) {
    return { categoryIds: [selectedSubcategory.id], requestedCategorySlug: categorySlug, requestedSubcategorySlug: subcategorySlug }
  }

  if (!selectedCategory) {
    return { categoryIds: null, requestedCategorySlug: null, requestedSubcategorySlug: null }
  }

  if (selectedCategory.parentId === null) {
    const childIds = categories.filter(c => c.parentId === selectedCategory.id).map(c => c.id)
    return { categoryIds: [selectedCategory.id, ...childIds], requestedCategorySlug: selectedCategory.slug, requestedSubcategorySlug: null }
  }

  return { categoryIds: [selectedCategory.id], requestedCategorySlug: selectedCategory.slug, requestedSubcategorySlug: null }
}
