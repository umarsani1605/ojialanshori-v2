import type { H3Event } from 'h3'
import type { Pool } from 'mysql2/promise'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '#server/db/schema'
import { hasMysqlRuntimeConfig, requireMysqlUrl } from '#server/utils/runtime'

export type Database = MySql2Database<typeof schema>

const globalForDb = globalThis as unknown as {
  _dbClient?: Pool
  _db?: Database
}

const DB_TIMEZONE_OFFSET = '+07:00'

export function isMysqlConfigured(event: H3Event) {
  return hasMysqlRuntimeConfig(event)
}

export function useDbClient(event: H3Event) {
  if (globalForDb._dbClient) {
    return globalForDb._dbClient
  }

  const pool = mysql.createPool({
    uri: requireMysqlUrl(event),
    timezone: DB_TIMEZONE_OFFSET,
    dateStrings: true,
  })

  pool.on('connection', (connection) => {
    connection.query(`SET time_zone = '${DB_TIMEZONE_OFFSET}'`)
  })

  globalForDb._dbClient = pool

  return globalForDb._dbClient
}

export function useDb(event: H3Event) {
  if (globalForDb._db) {
    return globalForDb._db
  }

  globalForDb._db = drizzle({
    client: useDbClient(event),
    schema,
    casing: 'snake_case',
    mode: 'default',
  })

  return globalForDb._db
}
