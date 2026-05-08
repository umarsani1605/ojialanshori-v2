import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { registerSantri } from '#server/services/auth/authService'
import { validateRegisterSantriBody } from '#server/utils/validation'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, validateRegisterSantriBody)

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const user = await registerSantri(useDb(event), input)

  return {
    user: {
      id: user?.id,
      fullname: user?.fullname,
      email: user?.email,
      role: user?.role,
      isActive: user?.isActive,
    },
  }
})
