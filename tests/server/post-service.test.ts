import { afterEach, describe, expect, it, vi } from 'vitest'

const listPostsForReview = vi.fn()
const listOwnPenaSantriPosts = vi.fn()

vi.mock('~~/server/repositories/posts/postRepository', async () => {
  const actual = await vi.importActual<typeof import('~~/server/repositories/posts/postRepository')>(
    '~~/server/repositories/posts/postRepository',
  )

  return {
    ...actual,
    listPostsForReview,
    listOwnPenaSantriPosts,
  }
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('listPostsForActor', () => {
  it('returns reviewer own posts by default', async () => {
    const ownPosts = {
      data: [{ id: 7, title: 'Tulisan Saya', status: 'draft' }],
      counts: { all: 1, published: 0, pendingReview: 0, rejected: 0, draft: 1 },
    }
    listOwnPenaSantriPosts.mockResolvedValueOnce(ownPosts)

    const { listPostsForActor } = await import('~~/server/services/posts/postService')

    const result = await listPostsForActor(
      {} as never,
      {
        id: 11,
        fullname: 'Reviewer',
        email: 'reviewer@example.com',
        role: 'reviewer',
      },
    )

    expect(listOwnPenaSantriPosts).toHaveBeenCalledWith({}, 11, undefined)
    expect(listPostsForReview).not.toHaveBeenCalled()
    expect(result).toBe(ownPosts)
  })

  it('returns review queue when reviewer requests review scope', async () => {
    const queue = [{ id: 19, title: 'Perlu Direview', status: 'pending_review' }]
    listPostsForReview.mockResolvedValueOnce(queue)

    const { listPostsForActor } = await import('~~/server/services/posts/postService')

    const result = await listPostsForActor(
      {} as never,
      {
        id: 11,
        fullname: 'Reviewer',
        email: 'reviewer@example.com',
        role: 'reviewer',
      },
      undefined,
      'review',
    )

    expect(listPostsForReview).toHaveBeenCalledWith({})
    expect(listOwnPenaSantriPosts).not.toHaveBeenCalled()
    expect(result).toEqual({ data: queue })
  })

  it('rejects review scope for santri', async () => {
    const { listPostsForActor } = await import('~~/server/services/posts/postService')

    await expect(
      listPostsForActor(
        {} as never,
        {
          id: 21,
          fullname: 'Santri',
          email: 'santri@example.com',
          role: 'santri',
        },
        undefined,
        'review',
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})
