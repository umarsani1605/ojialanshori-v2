/**
 * Migration script: Tags and post_tags pivot table
 * Source: WordPress REST API (https://ojialanshori.com/wp-json/wp/v2/)
 *
 * Usage:
 *   npx tsx scripts/migrate-tags.ts
 *
 * Requirements:
 *   - MYSQL_URL set in .env
 *   - E1-008 schema & migrations already applied to the database
 *   - migrate-content.ts must have been run first (generates migrate-content-map.json)
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq, and } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as schema from '../server/db/schema.js'

// ─── WordPress API types ─────────────────────────────────────────────────────

interface WPTag {
  id: number
  name: string
  slug: string
  count: number
}

interface WPPost {
  id: number
  slug: string
  tags: number[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WP_API = 'https://ojialanshori.com/wp-json/wp/v2'

async function fetchAll<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
  const results: T[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const url = new URL(`${WP_API}${endpoint}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', '100')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`WP API ${res.status}: ${url}`)

    if (page === 1) {
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1', 10)
      const total = res.headers.get('X-WP-Total')
      console.log(`    Total: ${total} items across ${totalPages} pages`)
    }

    const data = (await res.json()) as T[]
    results.push(...data)
    console.log(`    Page ${page}/${totalPages} — fetched ${data.length} items`)
    page++
  }

  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) {
    throw new Error('MYSQL_URL is not set. Check your .env file.')
  }

  console.log('🔌 Connecting to database...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  // ── 1. Fetch tags from WordPress ─────────────────────────────────────────────

  console.log('\n🏷️  Fetching tags from WordPress...')
  const wpTags = await fetchAll<WPTag>('/tags')

  // Filter out unused tags (count === 0)
  const activeTags = wpTags.filter(tag => tag.count > 0)
  console.log(`  Active tags (count > 0): ${activeTags.length} of ${wpTags.length}`)

  // wp_tag_id → new_tag_id mapping
  const tagIdMap = new Map<number, number>()

  // ── 2. Insert tags (idempotent) ──────────────────────────────────────────────

  console.log('\n🏷️  Migrating tags...')
  let tagOk = 0, tagErr = 0

  for (const tag of activeTags) {
    try {
      const existing = await db.query.tags.findFirst({
        where: eq(schema.tags.slug, tag.slug),
      })

      if (existing) {
        tagIdMap.set(tag.id, existing.id)
        tagOk++
        continue
      }

      const result = await db.insert(schema.tags).values({
        name: tag.name,
        slug: tag.slug,
      })
      tagIdMap.set(tag.id, result[0].insertId)
      tagOk++
    }
    catch (e) {
      console.error(`  ❌ Tag "${tag.slug}":`, (e as Error).message)
      tagErr++
    }
  }
  console.log(`  ✅ ${tagOk} ok  ❌ ${tagErr} errors`)

  // ── 3. Load post ID mapping from migrate-content-map.json ───────────────────

  console.log('\n🗺️  Loading post ID mapping...')
  const mapPath = path.join(process.cwd(), 'scripts/migrate-content-map.json')

  // wp_post_id → new_post_id mapping
  const postIdMap = new Map<number, number>()

  let mapFileExists = false
  try {
    await fs.access(mapPath)
    mapFileExists = true
  }
  catch {
    // file doesn't exist
  }

  if (mapFileExists) {
    const raw = await fs.readFile(mapPath, 'utf-8')
    const contentMap = JSON.parse(raw) as {
      categories: Record<string, number>
      posts: Record<string, number>
      pages: Record<string, number>
    }

    for (const [wpId, newId] of Object.entries(contentMap.posts)) {
      postIdMap.set(Number(wpId), newId)
    }
    console.log(`  Loaded ${postIdMap.size} post mappings from migrate-content-map.json`)
  }
  else {
    // Fallback: fetch WP posts and match by slug in DB
    console.log('  ⚠️  migrate-content-map.json not found — fetching posts from WP and matching by slug...')
    const wpPostsForMapping = await fetchAll<WPPost>('/posts', { status: 'publish', _fields: 'id,slug' })

    for (const wpPost of wpPostsForMapping) {
      const dbPost = await db.query.posts.findFirst({
        where: eq(schema.posts.slug, wpPost.slug),
      })
      if (dbPost) {
        postIdMap.set(wpPost.id, dbPost.id)
      }
      else {
        console.warn(`  ⚠️  No DB post found for WP slug "${wpPost.slug}"`)
      }
    }
    console.log(`  Matched ${postIdMap.size} posts by slug`)
  }

  // ── 4. Fetch WP posts with tags field ───────────────────────────────────────

  console.log('\n📝 Fetching posts with tags from WordPress...')
  const wpPosts = await fetchAll<WPPost>('/posts', {
    status: 'publish',
    _fields: 'id,slug,tags',
  })

  const postsWithTags = wpPosts.filter(p => p.tags.length > 0)
  console.log(`  Posts with at least one tag: ${postsWithTags.length} of ${wpPosts.length}`)

  // ── 5. Insert post_tags relations (idempotent) ───────────────────────────────

  console.log('\n🔗 Migrating post_tags relations...')
  let relOk = 0, relSkip = 0, relErr = 0

  for (const post of postsWithTags) {
    const newPostId = postIdMap.get(post.id)
    if (!newPostId) {
      console.warn(`  ⚠️  Post WP#${post.id} ("${post.slug}") has no DB mapping — skipping`)
      continue
    }

    for (const wpTagId of post.tags) {
      const newTagId = tagIdMap.get(wpTagId)
      if (!newTagId) {
        console.warn(`  ⚠️  Tag WP#${wpTagId} not in mapping (maybe count=0?) — skipping for post WP#${post.id}`)
        continue
      }

      try {
        const existing = await db.query.postTags.findFirst({
          where: and(
            eq(schema.postTags.postId, newPostId),
            eq(schema.postTags.tagId, newTagId),
          ),
        })

        if (existing) {
          relSkip++
          continue
        }

        await db.insert(schema.postTags).values({
          postId: newPostId,
          tagId: newTagId,
        })
        relOk++
      }
      catch (e) {
        console.error(`  ❌ post_tags (post=${newPostId}, tag=${newTagId}):`, (e as Error).message)
        relErr++
      }
    }
  }
  console.log(`  ✅ ${relOk} inserted  ⏭️  ${relSkip} already existed  ❌ ${relErr} errors`)

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n🎉 Tags migration complete!')
  console.log(`   Tags imported  : ${tagOk}`)
  console.log(`   Relations new  : ${relOk}`)
  console.log(`   Relations skip : ${relSkip}`)

  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
