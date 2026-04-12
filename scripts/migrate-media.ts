/**
 * Migration script: Media ke Cloudflare R2
 * Source: URL publik WordPress (ojialanshori.com/wp-content/uploads/)
 *
 * Usage:
 *   pnpm migrate:media
 *
 * Requirements:
 *   - MYSQL_URL — new database (target)
 *   - R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT — Cloudflare R2
 *   - OJI-3 (migrate:content) dan OJI-4 (migrate:users) sudah dijalankan
 *
 * Path convention:
 *   WP URL:   https://ojialanshori.com/wp-content/uploads/2024/07/foto.jpg
 *   R2 key:   uploads/2024/07/foto.jpg
 *   New URL:  /images/uploads/2024/07/foto.jpg
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { eq } from 'drizzle-orm'
import * as schema from '../server/db/schema.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const WP_UPLOADS_BASE = 'https://ojialanshori.com/wp-content/uploads/'
const NEW_URL_PREFIX = '/images/uploads/'
const URL_REGEX = /https?:\/\/ojialanshori\.com\/wp-content\/uploads\/([^\s"'<>)\]]+)/g

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function urlToR2Key(url: string): string {
  const path = url.replace(/https?:\/\/ojialanshori\.com\/wp-content\/uploads\//, '')
  return `uploads/${path}`
}

function urlToNewUrl(url: string): string {
  const path = url.replace(/https?:\/\/ojialanshori\.com\/wp-content\/uploads\//, '')
  return `${NEW_URL_PREFIX}${path}`
}

function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

function extractUrls(html: string | null): string[] {
  if (!html) return []
  const urls: string[] = []
  const regex = new RegExp(URL_REGEX.source, URL_REGEX.flags)
  let match
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[0])
  }
  return urls
}

async function existsInR2(s3: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  }
  catch {
    return false
  }
}

async function uploadToR2(s3: S3Client, bucket: string, key: string, url: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentLength = response.headers.get('content-length')
  const body = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: getMimeType(url),
    ...(contentLength ? { ContentLength: Number(contentLength) } : {}),
  }))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) throw new Error('MYSQL_URL is not set.')
  if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID is not set.')
  if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY is not set.')
  if (!process.env.R2_BUCKET) throw new Error('R2_BUCKET is not set.')
  if (!process.env.R2_ENDPOINT) throw new Error('R2_ENDPOINT is not set.')

  const R2_BUCKET = process.env.R2_BUCKET

  // ── Connect ─────────────────────────────────────────────────────────────────

  console.log('🔌 Connecting...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })

  // ── 1. Collect all media URLs from DB ───────────────────────────────────────

  console.log('\n🔍 Scanning media URLs from database...')

  const [allPosts, allPages] = await Promise.all([
    db.select({
      id: schema.posts.id,
      content: schema.posts.content,
      featuredImage: schema.posts.featuredImage,
    }).from(schema.posts),
    db.select({
      id: schema.pages.id,
      content: schema.pages.content,
    }).from(schema.pages),
  ])

  const urlSet = new Set<string>()

  for (const post of allPosts) {
    extractUrls(post.content).forEach(u => urlSet.add(u))
    if (post.featuredImage && post.featuredImage.startsWith(WP_UPLOADS_BASE)) {
      urlSet.add(post.featuredImage)
    }
  }
  for (const page of allPages) {
    extractUrls(page.content).forEach(u => urlSet.add(u))
  }

  const urls = [...urlSet]
  console.log(`  Found ${urls.length} unique media URLs`)

  // ── 2. Upload to R2 ─────────────────────────────────────────────────────────

  console.log('\n📤 Uploading to R2...')
  let uploaded = 0, skipped = 0, failed = 0

  for (const url of urls) {
    const key = urlToR2Key(url)

    try {
      const exists = await existsInR2(s3, R2_BUCKET, key)
      if (exists) {
        skipped++
        continue
      }

      await uploadToR2(s3, R2_BUCKET, key, url)
      uploaded++
      console.log(`  ✅ ${key}`)
    }
    catch (e) {
      const err = e as Error
      if (err.message.includes('404') || err.message.includes('HTTP 404')) {
        console.warn(`  ⚠️  404 — skipped: ${url}`)
        skipped++
      }
      else {
        console.error(`  ❌ ${url}: ${err.message}`)
        failed++
      }
    }
  }

  console.log(`\n  ✅ ${uploaded} uploaded  ⏭️  ${skipped} skipped  ❌ ${failed} failed`)

  // ── 3. Update URLs in DB ────────────────────────────────────────────────────

  console.log('\n🔄 Updating URLs in database...')

  let postsUpdated = 0, pagesUpdated = 0

  for (const post of allPosts) {
    const newContent = post.content.replace(URL_REGEX, url => urlToNewUrl(url))
    const newFeaturedImage = (post.featuredImage && post.featuredImage.startsWith(WP_UPLOADS_BASE))
      ? urlToNewUrl(post.featuredImage)
      : post.featuredImage

    const contentChanged = newContent !== post.content
    const imageChanged = newFeaturedImage !== post.featuredImage

    if (contentChanged || imageChanged) {
      await db.update(schema.posts)
        .set({
          ...(contentChanged ? { content: newContent } : {}),
          ...(imageChanged ? { featuredImage: newFeaturedImage } : {}),
        })
        .where(eq(schema.posts.id, post.id))
      postsUpdated++
    }
  }

  for (const page of allPages) {
    const newContent = page.content.replace(URL_REGEX, url => urlToNewUrl(url))
    if (newContent !== page.content) {
      await db.update(schema.pages)
        .set({ content: newContent })
        .where(eq(schema.pages.id, page.id))
      pagesUpdated++
    }
  }

  console.log(`  ✅ ${postsUpdated} posts updated  ✅ ${pagesUpdated} pages updated`)

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n🎉 Media migration complete!')
  console.log(`   Uploaded : ${uploaded}`)
  console.log(`   Skipped  : ${skipped}`)
  console.log(`   Failed   : ${failed}`)
  console.log(`   DB posts : ${postsUpdated}`)
  console.log(`   DB pages : ${pagesUpdated}`)

  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
