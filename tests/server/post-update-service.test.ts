import { afterEach, describe, expect, it, vi } from 'vitest'

const findPostById = vi.fn()
const generateUniquePostSlug = vi.fn()
const updatePost = vi.fn()
const syncPostTags = vi.fn()
const ensureCategoryExists = vi.fn()

vi.mock('~~/server/repositories/posts/postRepository', async () => {
  const actual = await vi.importActual<typeof import('~~/server/repositories/posts/postRepository')>(
    '~~/server/repositories/posts/postRepository',
  )

  return {
    ...actual,
    findPostById,
    generateUniquePostSlug,
    updatePost,
  }
})

vi.mock('~~/server/repositories/posts/postTagRepository', () => ({
  syncPostTags,
}))

vi.mock('~~/server/utils/santriPostEditor', async () => {
  const actual = await vi.importActual<typeof import('~~/server/utils/santriPostEditor')>(
    '~~/server/utils/santriPostEditor',
  )

  return {
    ...actual,
    assertDraftPayload: vi.fn(),
    ensureCategoryExists,
  }
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('updatePostForActor', () => {
  it('resets own published pena_santri post back to draft', async () => {
    findPostById.mockResolvedValueOnce({
      id: 94,
      title: 'Artikel Lama',
      status: 'published',
      author: { id: 11, fullname: 'Reviewer', email: 'reviewer@example.com' },
      category: { id: 10, name: 'Bincang Asyik', type: 'pena_santri' },
    })
    generateUniquePostSlug.mockResolvedValueOnce('artikel-baru')

    const { updatePostForActor } = await import('~~/server/services/posts/postService')

    const result = await updatePostForActor(
      {} as never,
      {
        id: 11,
        fullname: 'Reviewer',
        email: 'reviewer@example.com',
        role: 'reviewer',
      },
      94,
      {
        title: 'Artikel Baru',
        content: '<p>Isi</p>',
        excerpt: null,
        featuredImage: '/cover.jpg',
        categoryId: 10,
        postType: 'pena_santri',
        tags: [],
      },
    )

    expect(updatePost).toHaveBeenCalledWith({} as never, 94, expect.objectContaining({
      status: 'draft',
      reviewNote: null,
      slug: 'artikel-baru',
    }))
    expect(syncPostTags).toHaveBeenCalledWith({} as never, 94, [])
    expect(result).toEqual({ id: 94, status: 'draft' })
  })

  it('keeps status when reviewer edits someone else post in review flow', async () => {
    findPostById.mockResolvedValueOnce({
      id: 95,
      title: 'Artikel Santri',
      status: 'pending_review',
      author: { id: 21, fullname: 'Santri', email: 'santri@example.com' },
      category: { id: 10, name: 'Bincang Asyik', type: 'pena_santri' },
    })
    generateUniquePostSlug.mockResolvedValueOnce('artikel-santri')

    const { updatePostForActor } = await import('~~/server/services/posts/postService')

    const result = await updatePostForActor(
      {} as never,
      {
        id: 11,
        fullname: 'Reviewer',
        email: 'reviewer@example.com',
        role: 'reviewer',
      },
      95,
      {
        title: 'Artikel Santri',
        content: '<p>Isi</p>',
        excerpt: null,
        featuredImage: '/cover.jpg',
        categoryId: 10,
        postType: 'pena_santri',
        tags: [],
      },
    )

    expect(updatePost).toHaveBeenCalledWith({} as never, 95, expect.not.objectContaining({
      status: 'draft',
    }))
    expect(result).toEqual({ id: 95, status: 'pending_review' })
  })
})
