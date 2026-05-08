import { eq } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import type { PostStatus } from '#server/db/schema'
import {
  canApprovePost,
  canCreatePost,
  canDeletePost,
  canEditPost,
  canPublishPost,
  canRejectPost,
  canSubmitPost,
  canViewPost,
} from '#server/policies/posts'
import {
  deletePost,
  findPostById,
  findPostByIdForSantri,
  generateUniquePostSlug,
  insertPost,
  listAllPosts,
  listOwnPenaSantriPosts,
  listPostsForReview,
  updatePost,
  type Database,
} from '#server/repositories/posts/postRepository'
import { syncPostTags } from '#server/repositories/posts/postTagRepository'
import {
  assertDraftPayload,
  assertSubmitPayload,
  ensureCategoryExists,
  type SantriPostPayload,
} from '#server/utils/santriPostEditor'
import type { Role } from '#server/utils/guard'

export type Actor = {
  id: number
  name: string
  email: string
  role: Role
}

type ReviewPayload = {
  title?: string
  content?: string
  excerpt?: string | null
  categoryId?: number
  featuredImage?: string | null
  tags?: string[]
}

type RejectPayload = ReviewPayload & {
  reviewNote: string
}

export async function listPostsForActor(db: Database, actor: Actor, status?: PostStatus) {
  if (actor.role === 'admin') {
    const rows = await db.query.posts.findMany({
      where: status ? eq(schema.posts.status, status) : undefined,
      orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
      columns: { id: true, title: true, slug: true, status: true, updatedAt: true, publishedAt: true },
      with: {
        author: { columns: { id: true, name: true } },
        category: { columns: { id: true, name: true, type: true } },
      },
    })
    return { data: rows }
  }
  if (actor.role === 'reviewer') {
    return { data: await listPostsForReview(db) }
  }
  return listOwnPenaSantriPosts(db, actor.id, status)
}

export async function getPostForActor(db: Database, actor: Actor, postId: number) {
  if (actor.role === 'santri') {
    const post = await findPostByIdForSantri(db, postId, actor.id)
    if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })
    return post
  }

  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canViewPost(actor.role, categoryType, post.author.id, actor.id, post.status)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  return post
}

export async function createPostForActor(
  db: Database,
  actor: Actor,
  payload: SantriPostPayload,
) {
  assertDraftPayload(payload)

  await ensureCategoryExists(db, payload.categoryId)

  const categoryType = payload.categoryId
    ? await getCategoryType(db, payload.categoryId)
    : actor.role === 'admin' ? 'berita' : 'pena_santri'

  if (!canCreatePost(actor.role, categoryType)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const slug = await generateUniquePostSlug(db, payload.title)
  const postId = await insertPost(db, {
    title: payload.title,
    slug,
    content: payload.content,
    excerpt: payload.excerpt,
    featuredImage: payload.featuredImage,
    categoryId: payload.categoryId,
    authorId: actor.id,
    status: 'draft',
  })

  await syncPostTags(db, postId, payload.tags)

  return { id: postId, status: 'draft' as const }
}

export async function updatePostForActor(
  db: Database,
  actor: Actor,
  postId: number,
  payload: SantriPostPayload,
) {
  assertDraftPayload(payload)

  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canEditPost(actor.role, categoryType, post.author.id, actor.id)) {
    throw createError({ statusCode: 403, message: 'Kamu tidak diizinkan mengedit post ini.' })
  }

  if (actor.role === 'santri' && post.status === 'pending_review') {
    throw createError({ statusCode: 403, message: 'Post yang sedang direview tidak bisa diedit.' })
  }

  await ensureCategoryExists(db, payload.categoryId)

  const slug = await generateUniquePostSlug(db, payload.title, postId)
  await updatePost(db, postId, {
    title: payload.title,
    slug,
    content: payload.content,
    excerpt: payload.excerpt,
    featuredImage: payload.featuredImage,
    categoryId: payload.categoryId,
    ...(actor.role === 'santri' ? { status: 'draft', reviewNote: null } : {}),
  })

  await syncPostTags(db, postId, payload.tags)

  return { id: postId, status: post.status }
}

export async function deletePostForActor(db: Database, actor: Actor, postId: number) {
  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canDeletePost(actor.role, categoryType, post.author.id, actor.id)) {
    throw createError({ statusCode: 403, message: 'Kamu tidak diizinkan menghapus post ini.' })
  }

  await deletePost(db, postId)
  return { id: postId }
}

export async function submitPostForReview(
  db: Database,
  actor: Actor,
  postId: number,
  payload: SantriPostPayload,
) {
  assertSubmitPayload(payload)

  const post = await findPostByIdForSantri(db, postId, actor.id)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  if (!canSubmitPost(actor.role, post.authorId, actor.id)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (post.status === 'pending_review') {
    throw createError({ statusCode: 403, message: 'Post yang sedang direview tidak bisa dikirim ulang.' })
  }

  await ensureCategoryExists(db, payload.categoryId)

  await updatePost(db, postId, {
    title: payload.title,
    content: payload.content,
    excerpt: payload.excerpt,
    featuredImage: payload.featuredImage,
    categoryId: payload.categoryId,
    status: 'pending_review',
    reviewNote: null,
  })

  await syncPostTags(db, postId, payload.tags)

  return { id: postId, slug: post.slug, status: 'pending_review' as const }
}

export async function approvePostForActor(
  db: Database,
  actor: Actor,
  postId: number,
  contentUpdate: ReviewPayload,
) {
  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canApprovePost(actor.role, categoryType)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (post.status !== 'pending_review') {
    throw createError({ statusCode: 409, message: 'Post tidak dalam status pending review.' })
  }

  const now = new Date()
  const displayTitle = contentUpdate.title ?? post.title

  const updateValues: Partial<typeof schema.posts.$inferInsert> = {
    status: 'published',
    publishedAt: now,
    reviewedBy: actor.id,
    reviewNote: null,
  }
  if (contentUpdate.title !== undefined) updateValues.title = contentUpdate.title
  if (contentUpdate.content !== undefined) updateValues.content = contentUpdate.content
  if (contentUpdate.excerpt !== undefined) updateValues.excerpt = contentUpdate.excerpt
  if (contentUpdate.categoryId !== undefined) updateValues.categoryId = contentUpdate.categoryId
  if (contentUpdate.featuredImage !== undefined) updateValues.featuredImage = contentUpdate.featuredImage

  await updatePost(db, postId, updateValues)
  if (contentUpdate.tags !== undefined) await syncPostTags(db, postId, contentUpdate.tags)

  return {
    id: postId,
    status: 'published' as const,
    publishedAt: now,
    authorEmail: post.author.email,
    authorName: post.author.fullname,
    postTitle: displayTitle,
    postSlug: post.slug,
  }
}

export async function rejectPostForActor(
  db: Database,
  actor: Actor,
  postId: number,
  { reviewNote, ...contentUpdate }: RejectPayload,
) {
  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canRejectPost(actor.role, categoryType)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (post.status !== 'pending_review') {
    throw createError({ statusCode: 409, message: 'Post tidak dalam status pending review.' })
  }

  const displayTitle = contentUpdate.title ?? post.title

  const updateValues: Partial<typeof schema.posts.$inferInsert> = {
    status: 'rejected',
    reviewNote,
    reviewedBy: actor.id,
  }
  if (contentUpdate.title !== undefined) updateValues.title = contentUpdate.title
  if (contentUpdate.content !== undefined) updateValues.content = contentUpdate.content
  if (contentUpdate.excerpt !== undefined) updateValues.excerpt = contentUpdate.excerpt
  if (contentUpdate.categoryId !== undefined) updateValues.categoryId = contentUpdate.categoryId
  if (contentUpdate.featuredImage !== undefined) updateValues.featuredImage = contentUpdate.featuredImage

  await updatePost(db, postId, updateValues)
  if (contentUpdate.tags !== undefined) await syncPostTags(db, postId, contentUpdate.tags)

  return {
    id: postId,
    status: 'rejected' as const,
    authorEmail: post.author.email,
    authorName: post.author.fullname,
    postTitle: displayTitle,
    reviewerName: actor.fullname,
    reviewNote,
  }
}

export async function publishPostForActor(
  db: Database,
  actor: Actor,
  postId: number,
  payload: SantriPostPayload,
) {
  const post = await findPostById(db, postId)
  if (!post) throw createError({ statusCode: 404, message: 'Post tidak ditemukan.' })

  const categoryType = post.category?.type ?? 'pena_santri'
  if (!canPublishPost(actor.role, categoryType)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (post.author.id !== actor.id) {
    throw createError({ statusCode: 403, message: 'Kamu hanya bisa mempublish post milikmu sendiri.' })
  }

  const now = new Date()
  await updatePost(db, postId, {
    title: payload.title,
    content: payload.content,
    excerpt: payload.excerpt,
    categoryId: payload.categoryId,
    featuredImage: payload.featuredImage,
    status: 'published',
    publishedAt: now,
    reviewedBy: actor.id,
    reviewNote: null,
  })

  await syncPostTags(db, postId, payload.tags)

  return { id: postId, status: 'published' as const, publishedAt: now }
}

async function getCategoryType(db: Database, categoryId: number) {
  const cat = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
    columns: { type: true },
  })
  return cat?.type ?? 'pena_santri'
}
