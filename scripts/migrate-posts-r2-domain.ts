/**
 * Script: Migrate legacy WordPress image URLs di tabel `posts` ke R2 custom domain.
 *
 * Transform:
 *   https://ojialanshori.com/wp-content/uploads/...
 *   → https://assets.ojialanshori.com/uploads/...
 *
 * Kolom yang diupdate: featuredImage, content, excerpt.
 *
 * WAJIB backup dulu:
 *   mysqldump -u USER -p DATABASE posts > posts_backup_$(date +%Y%m%d_%H%M%S).sql
 *
 * Usage:
 *   pnpm tsx scripts/migrate-posts-r2-domain.ts
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const OLD = 'https://ojialanshori.com/wp-content/uploads/'
const NEW = 'https://assets.ojialanshori.com/uploads/'

async function main() {
  if (!process.env.MYSQL_URL) throw new Error('MYSQL_URL is not set.')

  console.log('🔌 Connecting to database...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)

  console.log(`🔄 Replacing "${OLD}" → "${NEW}"`)

  console.log('\n📊 Pre-check: berapa row yang akan terdampak?')
  const [pre] = await connection.execute(
    `SELECT
       SUM(featured_image LIKE ?) AS featured_count,
       SUM(content        LIKE ?) AS content_count,
       SUM(excerpt        LIKE ?) AS excerpt_count
     FROM posts`,
    [`%${OLD}%`, `%${OLD}%`, `%${OLD}%`],
  )
  console.log('  ', (pre as any)[0])

  console.log('\n🔄 Updating posts.featured_image...')
  const [featuredResult] = await connection.execute(
    `UPDATE posts SET featured_image = REPLACE(featured_image, ?, ?) WHERE featured_image LIKE ?`,
    [OLD, NEW, `%${OLD}%`],
  )
  console.log(`  ✅ Affected rows: ${(featuredResult as any).affectedRows}`)

  console.log('🔄 Updating posts.content (inline images)...')
  const [contentResult] = await connection.execute(
    `UPDATE posts SET content = REPLACE(content, ?, ?) WHERE content LIKE ?`,
    [OLD, NEW, `%${OLD}%`],
  )
  console.log(`  ✅ Affected rows: ${(contentResult as any).affectedRows}`)

  console.log('🔄 Updating posts.excerpt...')
  const [excerptResult] = await connection.execute(
    `UPDATE posts SET excerpt = REPLACE(excerpt, ?, ?) WHERE excerpt LIKE ?`,
    [OLD, NEW, `%${OLD}%`],
  )
  console.log(`  ✅ Affected rows: ${(excerptResult as any).affectedRows}`)

  console.log('\n📊 Post-check: sisa row yang masih punya URL lama (harus 0 semua)')
  const [post] = await connection.execute(
    `SELECT
       SUM(featured_image LIKE ?) AS featured_left,
       SUM(content        LIKE ?) AS content_left,
       SUM(excerpt        LIKE ?) AS excerpt_left
     FROM posts`,
    [`%${OLD}%`, `%${OLD}%`, `%${OLD}%`],
  )
  console.log('  ', (post as any)[0])

  console.log('\n🎉 Migration complete!')
  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Migration failed:', err)
  process.exit(1)
})
