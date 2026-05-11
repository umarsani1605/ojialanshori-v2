import { isMysqlConfigured, useDb } from '#server/utils/db'
import { createDatabaseNotConfiguredError } from '#server/utils/runtime'
import { registerSantri } from '#server/services/auth/authService'
import { zValidator } from '#server/utils/zod-validator'
import { registerSchema } from '~~/shared/schemas'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, zValidator(registerSchema))

  if (!isMysqlConfigured(event)) throw createDatabaseNotConfiguredError()

  const user = await registerSantri(useDb(event), input)

  const sessionId = getHeader(event, 'x-posthog-session-id')
  const distinctId = getHeader(event, 'x-posthog-distinct-id')
  useServerPostHog().capture({
    distinctId: distinctId ?? user?.email ?? 'anonymous',
    event: 'user_registered',
    properties: {
      $session_id: sessionId,
      user_id: user?.id,
      role: user?.role,
    },
  })

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
