/**
 * Migration script: Users & Profile Fields
 * Source: WordPress MySQL database (via WP_MYSQL_URL)
 *
 * Usage:
 *   pnpm migrate:users
 *
 * Requirements:
 *   - MYSQL_URL — new database (target)
 *   - WP_MYSQL_URL — WordPress database (source)
 *   - E1-002 schema & migrations already applied
 *   - E1-003 (migrate:content) already run — this script will also remap post author IDs
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as schema from '../server/db/schema.js'
import type { Role } from '../server/db/schema.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const WP_TABLE_PREFIX = process.env.WP_TABLE_PREFIX ?? 'wp_'

const ROLE_MAPPING: Record<string, Role> = {
  administrator: 'admin',
  editor: 'admin',
  author: 'reviewer',
  contributor: 'santri',
  subscriber: 'santri',
}

// Highest priority first
const ROLE_PRIORITY = ['administrator', 'editor', 'author', 'contributor', 'subscriber']

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse PHP serialized capabilities string.
 * Example: a:1:{s:13:"administrator";b:1;}
 */
function parseWpCapabilities(serialized: string | null): Role {
  if (!serialized) return 'santri'

  const matches = [...serialized.matchAll(/s:\d+:"([^"]+)";b:1/g)]
  const wpRoles = matches.map((m) => m[1]!).filter((r) => r in ROLE_MAPPING)

  for (const priority of ROLE_PRIORITY) {
    if (wpRoles.includes(priority)) return ROLE_MAPPING[priority]!
  }

  return 'santri'
}

// ─── WP User type ─────────────────────────────────────────────────────────────

interface WpUser {
  ID: number
  user_login: string
  user_nicename: string
  user_email: string
  display_name: string
  user_pass: string
  user_registered: Date
}

interface WpUserMetaRow {
  user_id: number
  meta_key: string
  meta_value: string | null
}

interface WpPost {
  ID: number
  post_author: number
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) throw new Error('MYSQL_URL is not set.')
  if (!process.env.WP_MYSQL_URL) throw new Error('WP_MYSQL_URL is not set.')

  // Connect to both databases
  console.log('🔌 Connecting to databases...')
  const [wpConn, newConn] = await Promise.all([
    mysql.createPool(process.env.WP_MYSQL_URL),
    mysql.createPool(process.env.MYSQL_URL),
  ]);
  const db = drizzle(newConn, { schema, casing: 'snake_case', mode: 'default' })

  const mapping: Record<number, number> = {} // wp_user_id → new_user_id

  // ── 1. Fetch users from WP database ─────────────────────────────────────────

  console.log('\n👤 Fetching users from WordPress database...')
  const [userRows] = await wpConn.execute<mysql.RowDataPacket[]>(`
    SELECT
      u.ID,
      u.user_login,
      u.user_nicename,
      u.user_email,
      u.display_name,
      u.user_pass,
      u.user_registered
    FROM ${WP_TABLE_PREFIX}users u
    ORDER BY u.ID
  `)
  const [metaRows] = await wpConn.execute<mysql.RowDataPacket[]>(`
    SELECT
      user_id,
      meta_key,
      meta_value
    FROM ${WP_TABLE_PREFIX}usermeta
    ORDER BY user_id, umeta_id
  `)

  const wpUsers = userRows as WpUser[]
  const wpUserMetaRows = metaRows as WpUserMetaRow[]
  const metaByUserId = new Map<number, Record<string, string | null>>()

  for (const row of wpUserMetaRows) {
    const meta = metaByUserId.get(row.user_id) ?? {}
    meta[row.meta_key] = row.meta_value
    metaByUserId.set(row.user_id, meta)
  }

  console.log(`  Found ${wpUsers.length} users`)

  // ── 2. Insert users into new database ──────────────────────────────────────

  console.log('\n📥 Migrating users...')
  const roleCounts: Record<Role, number> = {
    admin: 0,
    reviewer: 0,
    santri: 0,
  }
  let inserted = 0, updated = 0, err = 0, skipped = 0

  function pickMeta(meta: Record<string, string | null>, keys: string[]): string | null {
    for (const key of keys) {
      const value = meta[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return null
  }

  function parseYear(value: string | null): number | null {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1901 || parsed > 2155) return null
    return parsed
  }

  for (const wpUser of wpUsers) {
    const meta = metaByUserId.get(wpUser.ID) ?? {}
    const capabilitiesKey = `${WP_TABLE_PREFIX}capabilities`
    const role = parseWpCapabilities(meta[capabilitiesKey] ?? null)
    const fullname = wpUser.display_name.trim() || wpUser.user_nicename.trim() || wpUser.user_login.trim()
    const nickname = pickMeta(meta, ['nickname']) ?? (wpUser.user_nicename.trim() || null)
    const bio = pickMeta(meta, ['description'])
    const phone = pickMeta(meta, ['phone', 'phone_number', 'mobile', 'mobile_phone', 'whatsapp', 'whatsapp_number'])
    const university = pickMeta(meta, ['university', 'kampus', 'asal_kampus'])
    const faculty = pickMeta(meta, ['faculty', 'fakultas'])
    const major = pickMeta(meta, ['major', 'jurusan', 'prodi', 'program_studi'])
    const yearEnrolled = parseYear(pickMeta(meta, ['year_enrolled', 'angkatan_oji', 'angkatan_masuk_oji', 'angkatan']))
    const yearStudy = parseYear(pickMeta(meta, ['year_study', 'angkatan_kuliah']))

    try {
      // Check if email already exists (idempotent)
      const existing = await db.query.users.findFirst({
        where: eq(schema.users.email, wpUser.user_email),
      })

      if (existing) {
        if (existing.passwordType === 'phpass') {
          await db.update(schema.users).set({
            fullname,
            nickname,
            bio,
            role,
            phone,
            university,
            faculty,
            major,
            yearEnrolled,
            yearStudy,
            isActive: true,
          }).where(eq(schema.users.id, existing.id))
          updated++
        }
        mapping[wpUser.ID] = existing.id
        skipped++
        continue
      }

      const result = await db.insert(schema.users).values({
        fullname,
        nickname,
        bio,
        email: wpUser.user_email,
        password: wpUser.user_pass,
        passwordType: 'phpass',
        role,
        avatar: null, // avatar migration intentionally deferred
        phone,
        university,
        faculty,
        major,
        yearEnrolled,
        yearStudy,
        isActive: true,
        createdAt: new Date(wpUser.user_registered),
        updatedAt: new Date(wpUser.user_registered),
      })

      mapping[wpUser.ID] = result[0].insertId
      roleCounts[role]++
      inserted++
    }
    catch (e) {
      console.error(`  ❌ User "${wpUser.user_login}" (${wpUser.user_email}):`, (e as Error).message)
      err++
    }
  }

  console.log(`  ✅ ${inserted} inserted  🔄 ${updated} updated  ⏭️  ${skipped} skipped  ❌ ${err} errors`)
  console.log('  Role breakdown:')
  for (const [role, count] of Object.entries(roleCounts)) {
    if (count > 0) console.log(`    ${role}: ${count}`)
  }

  // ── 3. Save user mapping ────────────────────────────────────────────────────

  const userMapPath = path.join(process.cwd(), 'scripts/migrate-users-map.json')
  await fs.writeFile(userMapPath, JSON.stringify(mapping, null, 2), 'utf-8')
  console.log(`\n💾 User mapping saved to ${userMapPath}`)

  // ── 4. Remap post author IDs ────────────────────────────────────────────────
  // OJI-3 set all posts.author_id = 1 (placeholder).
  // Now that users are migrated, fetch WP post→author mapping and update.

  console.log('\n🔄 Remapping post author IDs...')

  const [postRows] = await wpConn.execute<mysql.RowDataPacket[]>(`
    SELECT ID, post_author
    FROM ${WP_TABLE_PREFIX}posts
    WHERE post_status IN ('publish', 'draft', 'pending', 'draft-revision') AND post_type = 'post'
  `)

  const wpPosts = postRows as WpPost[]

  // Load content mapping (wp_post_id → new_post_id) from OJI-3
  const contentMapPath = path.join(process.cwd(), 'scripts/migrate-content-map.json')
  let contentMap: { posts: Record<string, number> } = { posts: {} }
  try {
    const raw = await fs.readFile(contentMapPath, 'utf-8')
    contentMap = JSON.parse(raw)
  }
  catch {
    console.warn('  ⚠️  migrate-content-map.json not found — skipping author remap.')
    console.warn('     Run pnpm migrate:content first, then re-run this script.')
    await wpConn.end()
    await newConn.end()
    return
  }

  let remapped = 0, remapSkipped = 0
  for (const wpPost of wpPosts) {
    const newPostId = contentMap.posts[String(wpPost.ID)]
    const newAuthorId = mapping[wpPost.post_author]

    if (!newPostId || !newAuthorId) {
      remapSkipped++
      continue
    }

    await db
      .update(schema.posts)
      .set({ authorId: newAuthorId })
      .where(eq(schema.posts.id, newPostId))

    remapped++
  }

  console.log(`  ✅ ${remapped} posts remapped  ⏭️  ${remapSkipped} skipped`)

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n🎉 User migration complete!')
  console.log(`   Users migrated : ${inserted + updated}`)
  console.log(`   Posts remapped : ${remapped}`)

  await wpConn.end()
  await newConn.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
