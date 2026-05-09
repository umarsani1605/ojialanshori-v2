import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations/mysql',
  dialect: 'mysql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.MYSQL_URL || process.env.NUXT_MYSQL_URL || '',
  },
})
