import { afterEach, describe, expect, it, vi } from 'vitest'

const findCategoryById = vi.fn()
const findCategoryBySlug = vi.fn()
const findCategoryBySlugExcluding = vi.fn()
const insertCategory = vi.fn()
const listCategories = vi.fn()
const updateCategory = vi.fn()

vi.mock('~~/server/repositories/categories/categoryRepository', () => ({
  countChildCategories: vi.fn(),
  countPostsInCategory: vi.fn(),
  deleteCategory: vi.fn(),
  findCategoryById,
  findCategoryBySlug,
  findCategoryBySlugExcluding,
  insertCategory,
  listCategories,
  updateCategory,
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('category service', () => {
  it('lists only pena_santri categories for admin', async () => {
    listCategories.mockResolvedValue([
      { id: 1, name: 'Berita', type: 'berita' },
      { id: 2, name: 'Puisi', type: 'pena_santri' },
    ])

    const { listCategoriesForAdmin } = await import('~~/server/services/categories/categoryService')

    await expect(listCategoriesForAdmin({} as never)).resolves.toEqual([
      { id: 2, name: 'Puisi', type: 'pena_santri' },
    ])
  })

  it('creates a pena_santri category with generated slug and no parent', async () => {
    findCategoryBySlug.mockResolvedValue(null)
    insertCategory.mockResolvedValue(7)
    findCategoryById.mockResolvedValue({ id: 7, name: 'Catatan Ngaji', slug: 'catatan-ngaji', type: 'pena_santri', parentId: null })

    const { createCategory } = await import('~~/server/services/categories/categoryService')

    await expect(createCategory({} as never, { name: 'Catatan Ngaji' })).resolves.toMatchObject({
      id: 7,
      type: 'pena_santri',
      parentId: null,
      slug: 'catatan-ngaji',
    })

    expect(insertCategory).toHaveBeenCalledWith({} as never, {
      name: 'Catatan Ngaji',
      slug: 'catatan-ngaji',
      type: 'pena_santri',
      parentId: null,
    })
  })

  it('updates only the name-derived fields for an existing category', async () => {
    findCategoryById
      .mockResolvedValueOnce({ id: 4, name: 'Opini Lama', slug: 'opini-lama', type: 'pena_santri', parentId: null })
      .mockResolvedValueOnce({ id: 4, name: 'Opini Baru', slug: 'opini-baru', type: 'pena_santri', parentId: null })
    findCategoryBySlugExcluding.mockResolvedValue(null)

    const { patchCategory } = await import('~~/server/services/categories/categoryService')

    await expect(patchCategory({} as never, 4, { name: 'Opini Baru' })).resolves.toMatchObject({
      id: 4,
      name: 'Opini Baru',
      slug: 'opini-baru',
    })

    expect(updateCategory).toHaveBeenCalledWith({} as never, 4, {
      name: 'Opini Baru',
      slug: 'opini-baru',
      type: 'pena_santri',
      parentId: null,
    })
  })
})
