/**
 * Migration script: Posts, Pages, Categories
 * Source: WordPress REST API (https://ojialanshori.com/wp-json/wp/v2/)
 *
 * Usage:
 *   npx tsx scripts/migrate-content.ts
 *
 * Requirements:
 *   - MYSQL_URL set in .env
 *   - E1-002 schema & migrations already applied to the database
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as schema from '../server/db/schema.js'
import type { CategoryType, PageStatus } from '../server/db/schema.js'

// ─── WordPress API types ─────────────────────────────────────────────────────

interface WPCategory {
  id: number
  name: string
  slug: string
  parent: number
}

interface WPPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  author: number
  categories: number[]
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
  }
}

interface WPPage {
  id: number
  slug: string
  status: string
  title: { rendered: string }
  content: { rendered: string }
  date: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WP_API = 'https://ojialanshori.com/wp-json/wp/v2'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&hellip;/g, '...')
    .replace(/&#8230;/g, '...')
    .replace(/\[&hellip;\]/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

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

  const mapping = {
    categories: {} as Record<number, number>,
    posts: {} as Record<number, number>,
    pages: {} as Record<number, number>,
  }

  // ── 1. Categories ───────────────────────────────────────────────────────────

  console.log('\n📁 Migrating categories...')
  const wpCategories = await fetchAll<WPCategory>('/categories')

  // Build wp_id → slug map for parent resolution
  const wpSlugById = new Map(wpCategories.map((c) => [c.id, c.slug]))

  // Determine category type based on slug ancestry
  function getCategoryType(slug: string, parentId: number): CategoryType {
    if (slug === 'pena-santri') return 'pena_santri'
    if (parentId) {
      const parentSlug = wpSlugById.get(parentId)
      if (parentSlug === 'pena-santri') return 'pena_santri'
    }
    return 'berita'
  }

  // Sort: parents (parent === 0) first so FK references resolve in order
  const sortedCats = [...wpCategories].sort((a, b) => a.parent - b.parent)

  let catOk = 0, catErr = 0
  for (const cat of sortedCats) {
    const type = getCategoryType(cat.slug, cat.parent)
    const parentNewId = cat.parent ? (mapping.categories[cat.parent] ?? null) : null

    try {
      // Check if already exists (idempotent)
      const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.slug, cat.slug),
      })

      if (existing) {
        mapping.categories[cat.id] = existing.id
        catOk++
        continue
      }

      const result = await db.insert(schema.categories).values({
        name: cat.name,
        slug: cat.slug,
        parentId: parentNewId,
        type,
      })
      mapping.categories[cat.id] = result[0].insertId
      catOk++
    }
    catch (e) {
      console.error(`  ❌ Category "${cat.slug}":`, (e as Error).message)
      catErr++
    }
  }
  console.log(`  ✅ ${catOk} ok  ❌ ${catErr} errors`)

  // ── 2. Posts ────────────────────────────────────────────────────────────────

  console.log('\n📝 Migrating posts...')
  const wpPosts = await fetchAll<WPPost>('/posts', {
    status: 'publish',
    _embed: 'wp:featuredmedia',
  })

  // Default author ID — placeholder until E1-004 (user migration)
  // All posts temporarily attributed to author ID 1 (superadmin)
  const PLACEHOLDER_AUTHOR_ID = 1

  let postOk = 0, postErr = 0
  for (const post of wpPosts) {
    const categoryNewId = post.categories[0]
      ? (mapping.categories[post.categories[0]] ?? null)
      : null

    if (!categoryNewId) {
      console.warn(`  ⚠️  Post "${post.slug}" has no mapped category (wp_categories: ${post.categories})`)
    }

    const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null

    try {
      const existing = await db.query.posts.findFirst({
        where: eq(schema.posts.slug, post.slug),
      })

      if (existing) {
        mapping.posts[post.id] = existing.id
        postOk++
        continue
      }

      const result = await db.insert(schema.posts).values({
        title: stripHtml(post.title.rendered),
        slug: post.slug,
        content: post.content.rendered,
        excerpt: stripHtml(post.excerpt.rendered) || null,
        featuredImage: featuredImageUrl,
        categoryId: categoryNewId ?? 1,
        authorId: PLACEHOLDER_AUTHOR_ID,
        status: 'published',
        publishedAt: new Date(post.date),
        createdAt: new Date(post.date),
        updatedAt: new Date(post.date),
      })
      mapping.posts[post.id] = result[0].insertId
      postOk++
    }
    catch (e) {
      console.error(`  ❌ Post "${post.slug}":`, (e as Error).message)
      postErr++
    }
  }
  console.log(`  ✅ ${postOk} ok  ❌ ${postErr} errors`)

  // ── 3. Pages ────────────────────────────────────────────────────────────────

  console.log('\n📄 Migrating pages...')
  const wpPages = await fetchAll<WPPage>('/pages')

  let pageOk = 0, pageErr = 0
  for (const page of wpPages) {
    const status: PageStatus = page.status === 'publish' ? 'published' : 'draft'

    try {
      const existing = await db.query.pages.findFirst({
        where: eq(schema.pages.slug, page.slug),
      })

      if (existing) {
        mapping.pages[page.id] = existing.id
        pageOk++
        continue
      }

      const result = await db.insert(schema.pages).values({
        title: stripHtml(page.title.rendered),
        slug: page.slug,
        content: page.content.rendered,
        status,
        updatedAt: new Date(page.date),
      })
      mapping.pages[page.id] = result[0].insertId
      pageOk++
    }
    catch (e) {
      console.error(`  ❌ Page "${page.slug}":`, (e as Error).message)
      pageErr++
    }
  }
  console.log(`  ✅ ${pageOk} ok  ❌ ${pageErr} errors`)

  // ── 4. Save mapping for E1-005 (media migration) ────────────────────────────

  const mapPath = path.join(process.cwd(), 'scripts/migrate-content-map.json')
  await fs.writeFile(mapPath, JSON.stringify(mapping, null, 2), 'utf-8')
  console.log(`\n💾 Mapping saved to ${mapPath}`)

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n🎉 Migration complete!')
  console.log(`   Categories : ${Object.keys(mapping.categories).length}`)
  console.log(`   Posts      : ${Object.keys(mapping.posts).length}`)
  console.log(`   Pages      : ${Object.keys(mapping.pages).length}`)
  console.log('\n⚠️  Note: post.authorId is set to placeholder (1) until E1-004 user migration runs.')
  console.log('⚠️  Note: post.featuredImage contains original WP URL, will be updated by E1-005.')

  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
