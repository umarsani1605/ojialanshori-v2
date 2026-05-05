import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalLogFile = process.env.LOG_FILE
const originalLogLevel = process.env.LOG_LEVEL

let tempDir: string | undefined

afterEach(async () => {
  if (originalLogFile === undefined) {
    delete process.env.LOG_FILE
  }
  else {
    process.env.LOG_FILE = originalLogFile
  }

  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL
  }
  else {
    process.env.LOG_LEVEL = originalLogLevel
  }

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true })
    tempDir = undefined
  }

  vi.resetModules()
})

describe('server logger', () => {
  it('writes structured logs to the configured file', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'omahngaji-logs-'))
    const logFile = join(tempDir, 'server.jsonl')

    process.env.LOG_FILE = logFile
    process.env.LOG_LEVEL = 'debug'

    const { getServerLogger } = await import('~~/server/utils/logger')
    const logger = await getServerLogger()

    logger.info({ pathname: 'images/example.jpg' }, 'image requested')

    const log = await readFile(logFile, 'utf8')
    const entry = JSON.parse(log.trim()) as Record<string, unknown>

    expect(entry).toMatchObject({
      level: 30,
      message: 'image requested',
      pathname: 'images/example.jpg',
      service: 'omahngaji-v2',
      runtime: 'nuxt-server',
    })
    expect(entry.time).toEqual(expect.any(String))
  })
})
