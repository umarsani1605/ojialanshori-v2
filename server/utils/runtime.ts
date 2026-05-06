import type { H3Event } from 'h3'

type EventRuntimeConfigContext = H3Event['context'] & {
  runtimeConfig?: ReturnType<typeof useRuntimeConfig>
}

export function getServerRuntimeConfig(event: H3Event) {
  const contextConfig = (event.context as EventRuntimeConfigContext).runtimeConfig

  if (contextConfig) {
    return contextConfig
  }

  return useRuntimeConfig(event)
}

export function createDatabaseNotConfiguredError() {
  return createError({
    statusCode: 500,
    statusMessage: 'MYSQL_URL is not configured',
    message: 'Database tidak terkonfigurasi.',
  })
}

export function hasMysqlRuntimeConfig(event: H3Event) {
  return Boolean(getServerRuntimeConfig(event).mysqlUrl)
}

export function requireMysqlUrl(event: H3Event) {
  const mysqlUrl = getServerRuntimeConfig(event).mysqlUrl

  if (!mysqlUrl) {
    throw createDatabaseNotConfiguredError()
  }

  return mysqlUrl
}

export function getR2MediaConfig(event: H3Event) {
  const config = getServerRuntimeConfig(event)

  if (
    !config.r2AccessKeyId
    || !config.r2SecretAccessKey
    || !config.r2Bucket
    || !config.r2Endpoint
  ) {
    return null
  }

  return {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    bucket: config.r2Bucket,
    endpoint: config.r2Endpoint,
  }
}
