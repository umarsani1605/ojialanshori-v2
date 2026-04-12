/**
 * Migration script: Users & Password Hash
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
  administrator: 'superadmin',
  editor: 'pengurus',
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
  user_email: string
  display_name: string
  user_pass: string
  user_registered: Date
  capabilities: string | null
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
    mysql.createConnection(process.env.WP_MYSQL_URL),
    mysql.createConnection(process.env.MYSQL_URL),
  ])
  const db = drizzle(newConn, { schema, casing: 'snake_case' })

  const mapping: Record<number, number> = {} // wp_user_id → new_user_id

  // ── 1. Fetch users from WP database ─────────────────────────────────────────

  console.log('\n👤 Fetching users from WordPress database...')
  const [rows] = await wpConn.execute<mysql.RowDataPacket[]>(`
    SELECT
      u.ID,
      u.user_login,
      u.user_email,
      u.display_name,
      u.user_pass,
      u.user_registered,
      um.meta_value AS capabilities
    FROM ${WP_TABLE_PREFIX}users u
    LEFT JOIN ${WP_TABLE_PREFIX}usermeta um
      ON u.ID = um.user_id AND um.meta_key = '${WP_TABLE_PREFIX}capabilities'
    ORDER BY u.ID
  `)

  const wpUsers = rows as WpUser[]
  console.log(`  Found ${wpUsers.length} users`)

  // ── 2. Insert users into new database ──────────────────────────────────────

  console.log('\n📥 Migrating users...')
  const roleCounts: Record<Role, number> = {
    superadmin: 0,
    pengurus: 0,
    reviewer: 0,
    santri: 0,
  }
  let ok = 0, err = 0, skipped = 0

  for (const wpUser of wpUsers) {
    const role = parseWpCapabilities(wpUser.capabilities)

    try {
      // Check if email already exists (idempotent)
      const existing = await db.query.users.findFirst({
        where: eq(schema.users.email, wpUser.user_email),
      })

      if (existing) {
        mapping[wpUser.ID] = existing.id
        skipped++
        continue
      }

      const result = await db.insert(schema.users).values({
        name: wpUser.display_name || wpUser.user_login,
        username: wpUser.user_login,
        email: wpUser.user_email,
        passwordHash: wpUser.user_pass,
        passwordType: 'phpass',
        role,
        avatarPath: null,
        isActive: true,
        createdAt: new Date(wpUser.user_registered),
        updatedAt: new Date(wpUser.user_registered),
      })

      mapping[wpUser.ID] = result[0].insertId
      roleCounts[role]++
      ok++
    }
    catch (e) {
      // Handle duplicate username (user_login must be unique)
      const error = e as NodeJS.ErrnoException & { code?: string }
      if (error.code === 'ER_DUP_ENTRY' && error.message.includes('username')) {
        // Append numeric suffix to make username unique
        const uniqueUsername = `${wpUser.user_login}_${wpUser.ID}`
        try {
          const result = await db.insert(schema.users).values({
            name: wpUser.display_name || wpUser.user_login,
            username: uniqueUsername,
            email: wpUser.user_email,
            passwordHash: wpUser.user_pass,
            passwordType: 'phpass',
            role,
            avatarPath: null,
            isActive: true,
            createdAt: new Date(wpUser.user_registered),
            updatedAt: new Date(wpUser.user_registered),
          })
          mapping[wpUser.ID] = result[0].insertId
          console.warn(`  ⚠️  Duplicate username "${wpUser.user_login}" → renamed to "${uniqueUsername}"`)
          roleCounts[role]++
          ok++
        }
        catch (e2) {
          console.error(`  ❌ User "${wpUser.user_login}" (${wpUser.user_email}):`, (e2 as Error).message)
          err++
        }
      }
      else {
        console.error(`  ❌ User "${wpUser.user_login}" (${wpUser.user_email}):`, error.message)
        err++
      }
    }
  }

  console.log(`  ✅ ${ok} inserted  ⏭️  ${skipped} skipped  ❌ ${err} errors`)
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
    WHERE post_status = 'publish' AND post_type = 'post'
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
  console.log(`   Users migrated : ${ok}`)
  console.log(`   Posts remapped : ${remapped}`)

  await wpConn.end()
  await newConn.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
