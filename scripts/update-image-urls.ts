/**
 * Script: Update Image URLs from Proxy to Public Domain
 * 
 * Usage:
 *   pnpm update:image-urls
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { sql } from 'drizzle-orm'
import * as schema from '../server/db/schema.js'

async function main() {
  if (!process.env.MYSQL_URL) throw new Error('MYSQL_URL is not set.')
  
  const PUBLIC_DOMAIN = 'assets.ojialanshori.com'
  const OLD_PREFIX = '/images/'
  const NEW_PREFIX = `https://${PUBLIC_DOMAIN}/`

  console.log('🔌 Connecting to database...')
  const connection = await mysql.createConnection(process.env.MYSQL_URL)
  const db = drizzle(connection, { schema, casing: 'snake_case', mode: 'default' })

  console.log('🔄 Updating Posts (featured_image)...')
  const [postResult] = await connection.execute(
    `UPDATE posts SET featured_image = REPLACE(featured_image, ?, ?) WHERE featured_image LIKE ?`,
    [OLD_PREFIX, NEW_PREFIX, `${OLD_PREFIX}%`]
  )
  console.log(`  ✅ Posts updated: ${(postResult as any).affectedRows}`)

  console.log('🔄 Updating Posts (content inline images)...')
  const [contentResult] = await connection.execute(
    `UPDATE posts SET content = REPLACE(content, ?, ?) WHERE content LIKE ?`,
    [OLD_PREFIX, NEW_PREFIX, `%${OLD_PREFIX}%`]
  )
  console.log(`  ✅ Post contents updated: ${(contentResult as any).affectedRows}`)

  console.log('🔄 Updating Pages (content inline images)...')
  const [pageResult] = await connection.execute(
    `UPDATE pages SET content = REPLACE(content, ?, ?) WHERE content LIKE ?`,
    [OLD_PREFIX, NEW_PREFIX, `%${OLD_PREFIX}%`]
  )
  console.log(`  ✅ Page contents updated: ${(pageResult as any).affectedRows}`)

  console.log('🔄 Updating Gallery (image_path)...')
  const [galleryResult] = await connection.execute(
    `UPDATE gallery SET image_path = REPLACE(image_path, ?, ?) WHERE image_path LIKE ?`,
    [OLD_PREFIX, NEW_PREFIX, `${OLD_PREFIX}%`]
  )
  console.log(`  ✅ Gallery updated: ${(galleryResult as any).affectedRows}`)

  console.log('\n🎉 Database update complete!')
  await connection.end()
}

main().catch((err) => {
  console.error('\n💥 Update failed:', err)
  process.exit(1)
})
