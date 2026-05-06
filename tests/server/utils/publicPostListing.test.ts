import { describe, expect, it } from 'vitest'

import {
  normalizePublicPostListingOptions,
  resolveCategoryFilters,
} from '~~/server/utils/publicPostListing'

describe('normalizePublicPostListingOptions', () => {
  it('applies defaults and clamps pagination', () => {
    expect(normalizePublicPostListingOptions({
      type: 'berita',
      page: 0,
      limit: 99,
      sort: 'oldest',
    })).toMatchObject({
      type: 'berita',
      page: 1,
      limit: 24,
      sort: 'latest',
    })
  })
})

describe('resolveCategoryFilters', () => {
  const categories = [
    { id: 1, slug: 'kajian', parentId: null, type: 'berita' as const },
    { id: 2, slug: 'tafsir', parentId: 1, type: 'berita' as const },
    { id: 3, slug: 'hadits', parentId: 1, type: 'berita' as const },
    { id: 4, slug: 'wawasan', parentId: null, type: 'berita' as const },
    { id: 5, slug: 'opini-berita', parentId: 4, type: 'berita' as const },
    { id: 6, slug: 'opini', parentId: null, type: 'pena_santri' as const },
    { id: 7, slug: 'refleksi', parentId: 6, type: 'pena_santri' as const },
  ]

  it('includes parent and its child categories when category matches a parent slug', () => {
    expect(resolveCategoryFilters({
      type: 'berita',
      category: 'kajian',
      categories,
    })).toMatchObject({
      categoryIds: [1, 2, 3],
      requestedCategorySlug: 'kajian',
      requestedSubcategorySlug: null,
    })
  })

  it('narrows to a child category when category matches a child slug', () => {
    expect(resolveCategoryFilters({
      type: 'berita',
      category: 'tafsir',
      categories,
    })).toMatchObject({
      categoryIds: [2],
      requestedCategorySlug: 'tafsir',
      requestedSubcategorySlug: null,
    })
  })

  it('accepts a valid parent and child combination', () => {
    expect(resolveCategoryFilters({
      type: 'berita',
      category: 'kajian',
      subcategory: 'hadits',
      categories,
    })).toMatchObject({
      categoryIds: [3],
      requestedCategorySlug: 'kajian',
      requestedSubcategorySlug: 'hadits',
    })
  })

  it('rejects a subcategory outside the requested parent tree', () => {
    expect(() => resolveCategoryFilters({
      type: 'berita',
      category: 'kajian',
      subcategory: 'opini-berita',
      categories,
    })).toThrow(expect.objectContaining({
      statusCode: 400,
      statusMessage: 'Query parameter "subcategory" must belong to the requested "category".',
    }))
  })

  it('rejects unknown category or subcategory slugs', () => {
    expect(() => resolveCategoryFilters({
      type: 'berita',
      category: 'missing',
      categories,
    })).toThrow(expect.objectContaining({
      statusCode: 400,
      statusMessage: 'Category "missing" was not found.',
    }))

    expect(() => resolveCategoryFilters({
      type: 'berita',
      subcategory: 'missing',
      categories,
    })).toThrow(expect.objectContaining({
      statusCode: 400,
      statusMessage: 'Subcategory "missing" was not found.',
    }))
  })
})
