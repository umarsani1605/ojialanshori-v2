import { eq, inArray } from 'drizzle-orm'

import * as schema from '#server/db/schema'
import type { Database } from './postRepository'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'tag'
}

export async function syncPostTags(
  db: Database,
  postId: number,
  tags: string[],
): Promise<void> {
  await db.delete(schema.postTags).where(eq(schema.postTags.postId, postId))

  if (!tags.length) return

  const slugs = tags.map(tag => slugify(tag))
  const existingTags = await db
    .select({ id: schema.tags.id, name: schema.tags.name, slug: schema.tags.slug })
    .from(schema.tags)
    .where(inArray(schema.tags.slug, slugs))

  const existingBySlug = new Map(existingTags.map(tag => [tag.slug, tag]))
  const missingTags = tags
    .map((name, index) => ({ name, slug: slugs[index]! }))
    .filter(tag => !existingBySlug.has(tag.slug))

  if (missingTags.length) {
    await db.insert(schema.tags).values(missingTags)
  }

  const finalTags = await db
    .select({ id: schema.tags.id, slug: schema.tags.slug })
    .from(schema.tags)
    .where(inArray(schema.tags.slug, slugs))

  if (finalTags.length) {
    await db.insert(schema.postTags).values(
      finalTags.map(tag => ({ postId, tagId: tag.id })),
    )
  }
}
