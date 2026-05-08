import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, eq, inArray } from 'drizzle-orm'

import * as schema from '../server/db/schema.js'
import { hashUserPassword } from '../server/utils/password.js'

const DEMO_EMAIL = 'demo@ojialanshori.com'
const DEMO_FULLNAME = 'Fulan bin Fulan'
const DEMO_PASSWORD = 'demo123456'
const DEMO_BIO = 'Akun demo reviewer untuk mengecek alur post dengan semua status.'
const DEMO_SLUG_PREFIX = 'demo-fulan-bin-fulan'
const DEMO_CREATED_AT = new Date('2026-05-01T09:00:00.000Z')

type Database = MySql2Database<typeof schema>

type PostSeedStatus = 'draft' | 'pending_review' | 'published' | 'rejected'

type PostSeed = {
  status: PostSeedStatus
  title: string
  slug: string
  excerpt: string
  content: string
  reviewNote: string | null
  publishedAt: Date | null
}

const POST_SEEDS: PostSeed[] = [
  {
    status: 'draft',
    title: 'Demo Draft: Rutinitas Mengaji yang Konsisten',
    slug: `${DEMO_SLUG_PREFIX}-draft`,
    excerpt: 'Contoh artikel yang masih disimpan sebagai draft.',
    content: '<p>Ini adalah contoh artikel draft untuk menguji daftar post pada status draft.</p>',
    reviewNote: null,
    publishedAt: null,
  },
  {
    status: 'pending_review',
    title: 'Demo Pending Review: Adab Menuntut Ilmu',
    slug: `${DEMO_SLUG_PREFIX}-pending-review`,
    excerpt: 'Contoh artikel yang sudah dikirim untuk review.',
    content: '<p>Ini adalah contoh artikel yang sedang menunggu review dari reviewer atau admin.</p>',
    reviewNote: null,
    publishedAt: null,
  },
  {
    status: 'published',
    title: 'Demo Published: Istiqomah dalam Belajar',
    slug: `${DEMO_SLUG_PREFIX}-published`,
    excerpt: 'Contoh artikel yang sudah dipublish.',
    content: '<p>Ini adalah contoh artikel yang sudah dipublish dan tampil di halaman publik.</p>',
    reviewNote: null,
    publishedAt: new Date('2026-05-03T09:00:00.000Z'),
  },
  {
    status: 'rejected',
    title: 'Demo Rejected: Refleksi Ramadhan',
    slug: `${DEMO_SLUG_PREFIX}-rejected`,
    excerpt: 'Contoh artikel yang ditolak reviewer.',
    content: '<p>Ini adalah contoh artikel yang ditolak agar status rejected ikut terisi di data demo.</p>',
    reviewNote: 'Perlu menambahkan alur tulisan yang lebih runtut dan rujukan yang lebih jelas.',
    publishedAt: null,
  },
]

async function ensureDemoUser(db: Database, passwordHash: string) {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, DEMO_EMAIL),
  })

  if (existing) {
    await db
      .update(schema.users)
      .set({
        fullname: DEMO_FULLNAME,
        nickname: null,
        bio: DEMO_BIO,
        password: passwordHash,
        passwordType: 'bcrypt',
        role: 'reviewer',
        avatar: null,
        phone: null,
        university: null,
        faculty: null,
        major: null,
        yearStudy: null,
        yearEnrolled: null,
        isActive: true,
      })
      .where(eq(schema.users.id, existing.id))

    return existing.id
  }

  const [result] = await db.insert(schema.users).values({
    fullname: DEMO_FULLNAME,
    nickname: null,
    bio: DEMO_BIO,
    email: DEMO_EMAIL,
    password: passwordHash,
    passwordType: 'bcrypt',
    role: 'reviewer',
    avatar: null,
    phone: null,
    university: null,
    faculty: null,
    major: null,
    yearStudy: null,
    yearEnrolled: null,
    isActive: true,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  })

  return result.insertId
}

async function findSeedCategoryId(db: Database) {
  const preferredCategory = await db.query.categories.findFirst({
    where: eq(schema.categories.type, 'pena_santri'),
    orderBy: (categories, { asc }) => [asc(categories.id)],
  })

  if (preferredCategory) return preferredCategory.id

  const fallbackCategory = await db.query.categories.findFirst({
    orderBy: (categories, { asc }) => [asc(categories.id)],
  })

  if (!fallbackCategory) {
    throw new Error('Tidak ada kategori yang bisa dipakai untuk seed demo post.')
  }

  return fallbackCategory.id
}

async function findReviewerId(db: Database, demoUserId: number) {
  const reviewer = await db.query.users.findFirst({
    where: and(
      inArray(schema.users.role, ['admin', 'reviewer']),
      eq(schema.users.isActive, true),
    ),
    orderBy: (users, { asc }) => [asc(users.id)],
  })

  return reviewer?.id ?? demoUserId
}

async function upsertDemoPost(
  db: Database,
  seed: PostSeed,
  authorId: number,
  categoryId: number,
  reviewerId: number,
) {
  const existing = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, seed.slug),
  })

  const values = {
    title: seed.title,
    slug: seed.slug,
    content: seed.content,
    excerpt: seed.excerpt,
    featuredImage: null,
    categoryId,
    authorId,
    reviewedBy: seed.status === 'pending_review' ? null : reviewerId,
    status: seed.status,
    reviewNote: seed.reviewNote,
    publishedAt: seed.publishedAt,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  } satisfies typeof schema.posts.$inferInsert

  if (existing) {
    await db.update(schema.posts).set(values).where(eq(schema.posts.id, existing.id))
    return { id: existing.id, action: 'updated' as const }
  }

  const [result] = await db.insert(schema.posts).values(values)
  return { id: result.insertId, action: 'inserted' as const }
}

async function main() {
  if (!process.env.MYSQL_URL) {
    throw new Error('MYSQL_URL is not set. Check your .env file.')
  }

  console.log('🔌 Connecting to database...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)
  const db = drizzle(connection, {
    schema,
    casing: 'snake_case',
    mode: 'default',
  })

  const passwordHash = await hashUserPassword(DEMO_PASSWORD)
  const demoUserId = await ensureDemoUser(db, passwordHash)
  const categoryId = await findSeedCategoryId(db)
  const reviewerId = await findReviewerId(db, demoUserId)

  console.log(`  Demo user id: ${demoUserId}`)
  console.log(`  Using category id: ${categoryId}`)

  let inserted = 0
  let updated = 0

  for (const seed of POST_SEEDS) {
    const result = await upsertDemoPost(db, seed, demoUserId, categoryId, reviewerId)
    if (result.action === 'inserted') inserted++
    else updated++
  }

  console.log('\n🎉 Demo seed complete!')
  console.log(`   User     : ${DEMO_FULLNAME} <${DEMO_EMAIL}>`)
  console.log(`   Password : ${DEMO_PASSWORD}`)
  console.log(`   Posts    : ${inserted} inserted, ${updated} updated`)

  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Seed failed:', err)
  process.exit(1)
})
