import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { verifyLogin } from '#server/services/auth/authService'
import { validateLoginBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, validateLoginBody)

  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) {
    throw createError({ statusCode: 400, message: 'Tidak dapat mengidentifikasi alamat IP.' })
  }

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const result = await verifyLogin(useDb(event), input, ip)

  await setUserSession(event, { user: result.user }, { maxAge: result.maxAge })

  return { user: result.user }
})
