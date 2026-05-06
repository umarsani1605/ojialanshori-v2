import type { H3Event } from 'h3'
import type { Pool } from 'mysql2/promise'
import type { MySql2Database } from 'drizzle-orm/mysql2'

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import * as schema from '#server/db/schema'
import { hasMysqlRuntimeConfig, requireMysqlUrl } from '#server/utils/runtime'

export type Database = MySql2Database<typeof schema>

type DbEventContext = H3Event['context'] & {
  db?: Database
  dbClient?: Pool
}

function getDbContext(event: H3Event): DbEventContext {
  return event.context as DbEventContext
}

export function isMysqlConfigured(event: H3Event) {
  return hasMysqlRuntimeConfig(event)
}

export function useDbClient(event: H3Event) {
  const context = getDbContext(event)

  if (context.dbClient) {
    return context.dbClient
  }

  context.dbClient = mysql.createPool(requireMysqlUrl(event))

  return context.dbClient
}

export function useDb(event: H3Event) {
  const context = getDbContext(event)

  if (context.db) {
    return context.db
  }

  context.db = drizzle({
    client: useDbClient(event),
    schema,
    casing: 'snake_case',
    mode: 'default',
  })

  return context.db
}
