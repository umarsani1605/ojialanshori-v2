type LogPayload = Record<string, unknown>
type LogMethod = (payload: LogPayload, message?: string) => void

export interface ServerLogger {
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: LogMethod
}

let loggerPromise: Promise<ServerLogger> | undefined
const loggedErrors = new WeakSet<object>()

export function getServerLogger() {
  loggerPromise ??= createServerLogger()

  return loggerPromise
}

export function serializeError(error: unknown): LogPayload {
  if (!(error instanceof Error)) {
    return { value: error }
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: serializeCause(error),
  }
}

export function markErrorLogged(error: unknown) {
  if (isObject(error)) {
    loggedErrors.add(error)
  }
}

export function wasErrorLogged(error: unknown) {
  return isObject(error) && loggedErrors.has(error)
}

async function createServerLogger(): Promise<ServerLogger> {
  const nodeEnv = getEnv('NODE_ENV')
  const level = getEnv('LOG_LEVEL') || (nodeEnv === 'production' ? 'info' : 'debug')

  if (!isNodeRuntime()) {
    return createConsoleLogger(level)
  }

  try {
    const [{ default: pino }, fs, path] = await Promise.all([
      import('pino'),
      import('node:fs'),
      import('node:path'),
    ])
    const logFile = getEnv('LOG_FILE') || path.resolve(process.cwd(), 'logs/server.jsonl')

    await fs.promises.mkdir(path.dirname(logFile), { recursive: true })

    const logger = pino({
      level,
      base: {
        service: 'omahngaji-v2',
        runtime: 'nuxt-server',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      messageKey: 'message',
      serializers: {
        err: pino.stdSerializers.err,
      },
    }, pino.destination({
      dest: logFile,
      sync: nodeEnv === 'test',
    }))

    return logger
  }
  catch (error) {
    const logger = createConsoleLogger(level)

    logger.error({ err: serializeError(error) }, 'failed to initialize file logger')

    return logger
  }
}

function createConsoleLogger(_level: string): ServerLogger {
  return {
    debug: writeConsoleLog('debug'),
    info: writeConsoleLog('info'),
    warn: writeConsoleLog('warn'),
    error: writeConsoleLog('error'),
  } satisfies ServerLogger
}

function writeConsoleLog(level: 'debug' | 'info' | 'warn' | 'error'): LogMethod {
  return (payload, message) => {
    console[level](JSON.stringify({
      level,
      time: new Date().toISOString(),
      message,
      ...payload,
    }))
  }
}

function isNodeRuntime() {
  return typeof process !== 'undefined' && Boolean(process.versions?.node)
}

function isObject(value: unknown): value is object {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

function getEnv(name: string) {
  return typeof process !== 'undefined' ? process.env?.[name] : undefined
}

function serializeCause(error: Error) {
  if (!('cause' in error) || error.cause === undefined) {
    return undefined
  }

  return error.cause instanceof Error ? serializeError(error.cause) : error.cause
}
