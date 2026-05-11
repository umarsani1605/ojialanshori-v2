import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { verifyLogin } from '#server/services/auth/authService'
import { zValidator } from '#server/utils/zod-validator'
import { loginSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, zValidator(loginSchema))

  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) {
    throw createError({ statusCode: 400, message: 'Tidak dapat mengidentifikasi alamat IP.' })
  }

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await verifyLogin(useDb(event), input, ip)

  await setUserSession(event, { user: result.user }, { maxAge: result.maxAge })

  return { user: result.user }
})
