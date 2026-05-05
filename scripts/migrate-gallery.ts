/**
 * Migration script: Galeri Beranda → R2 + tabel `gallery`
 *
 * Sumber data: list manual (di-stripped dari halaman beranda WP lama).
 * Divi gallery module tidak punya tabel sendiri & gambarnya berserak di
 * /wp-content/uploads/, jadi list-nya ditulis eksplisit di sini.
 *
 * Usage:
 *   pnpm migrate:gallery
 *
 * Requirements:
 *   - MYSQL_URL
 *   - R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT
 *   - migrate:media boleh sudah dijalankan (akan skip key yang sudah ada)
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { eq, or } from 'drizzle-orm'
import * as schema from '../server/db/schema.js'

// ─── Source data ─────────────────────────────────────────────────────────────

type GalleryItem = { title: string; url: string }

const ITEMS: GalleryItem[] = [
  { title: 'Kyai Anshori bersama Bapak Rosyid', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/6-e1738571348220.jpg' },
  { title: 'Memperingati 17 Agustus', url: 'https://ojialanshori.com/wp-content/uploads/2025/02/IMG_9386-1-scaled-e1738571377103.jpg' },
  { title: 'Santri Omah Ngaji', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/IMG-20240719-WA0075-1-scaled.jpg' },
  { title: 'Hadroh Omah Ngaji', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/IMG-20240929-WA0083-scaled-e1738571762462.jpg' },
  { title: 'Ngaji Kitab', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/7-scaled-e1738571805527.jpg' },
  { title: 'Semaan Al Quran', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/oji-3.png' },
  { title: 'Diskusi Tematik', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/8-e1738571900160.jpg' },
  { title: 'Rutinan Pembacaan Maulid', url: 'https://ojialanshori.com/wp-content/uploads/2024/11/3-e1738571937387.jpg' },
]

// ─── Helpers (sama dgn migrate-media.ts) ─────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

function urlToR2Key(url: string): string {
  return `uploads/${url.replace(/https?:\/\/ojialanshori\.com\/wp-content\/uploads\//, '')}`
}

function urlToNewUrl(url: string): string {
  return `/images/uploads/${url.replace(/https?:\/\/ojialanshori\.com\/wp-content\/uploads\//, '')}`
}

function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
  return MIME_MAP[ext] ?? 'application/octet-stream'
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
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: getMimeType(url),
    ContentLength: buffer.byteLength,
  }))
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) throw new Error('MYSQL_URL is not set.')
  if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID is not set.')
  if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY is not set.')
  if (!process.env.R2_BUCKET) throw new Error('R2_BUCKET is not set.')
  if (!process.env.R2_ENDPOINT) throw new Error('R2_ENDPOINT is not set.')

  const R2_BUCKET = process.env.R2_BUCKET

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

  // ── 1. Upload to R2 ────────────────────────────────────────────────────────

  console.log(`\n📤 Uploading ${ITEMS.length} images to R2...`)
  let uploaded = 0, skipped = 0, failed = 0

  for (const item of ITEMS) {
    const key = urlToR2Key(item.url)
    try {
      if (await existsInR2(s3, R2_BUCKET, key)) {
        skipped++
        console.log(`  ⏭️  ${key} (already in R2)`)
        continue
      }
      await uploadToR2(s3, R2_BUCKET, key, item.url)
      uploaded++
      console.log(`  ✅ ${key}`)
    }
    catch (e) {
      failed++
      console.error(`  ❌ ${item.url}: ${(e as Error).message}`)
    }
  }

  console.log(`\n  ✅ ${uploaded} uploaded  ⏭️  ${skipped} skipped  ❌ ${failed} failed`)

  // ── 2. Insert / update rows in `gallery` ───────────────────────────────────

  console.log('\n💾 Writing rows to `gallery`...')

  let inserted = 0, updated = 0
  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]
    const imagePath = urlToNewUrl(item.url) // contoh: /images/uploads/2024/11/oji-3.png
    const legacyPath = urlToR2Key(item.url) //         uploads/2024/11/oji-3.png (tanpa prefix, dari run sebelumnya)
    const order = i + 1

    const existing = await db.select({ id: schema.gallery.id, imagePath: schema.gallery.imagePath })
      .from(schema.gallery)
      .where(or(
        eq(schema.gallery.imagePath, imagePath),
        eq(schema.gallery.imagePath, legacyPath),
      ))
      .limit(1)

    if (existing.length > 0) {
      await db.update(schema.gallery)
        .set({ title: item.title, imagePath, order })
        .where(eq(schema.gallery.id, existing[0].id))
      updated++
    }
    else {
      await db.insert(schema.gallery).values({
        title: item.title,
        imagePath,
        order,
      })
      inserted++
    }
  }

  console.log(`  ✅ ${inserted} inserted  🔁 ${updated} updated`)
  console.log('\n🎉 Gallery migration complete!')

  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
