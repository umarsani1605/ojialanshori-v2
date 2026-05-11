import { PostHog } from 'posthog-node'
import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * Custom error capture untuk PostHog dengan konteks tambahan.
 *
 * Menggantikan built-in `enableExceptionAutocapture` (di-disable di nuxt.config.ts)
 * supaya kita bisa:
 * 1. Filter 4xx — expected client errors, bukan bug, jangan masukin dashboard.
 * 2. Inject user context (id, role) dari session.
 * 3. Inject endpoint context (path, method, statusCode).
 */
export default defineNitroPlugin((nitroApp) => {
  const runtimeConfig = useRuntimeConfig()
  const posthogCommon = runtimeConfig.public.posthog
  const posthogServerConfig = runtimeConfig.posthogServerConfig

  if (!posthogCommon.publicKey) return

  const client = new PostHog(posthogCommon.publicKey, {
    host: posthogCommon.host,
    ...posthogServerConfig,
  })

  nitroApp.hooks.hook('error', async (error, ctx) => {
    const event = ctx?.event
    if (!event) return

    const statusCode = (error as { statusCode?: number })?.statusCode ?? 500

    // Skip 4xx — expected client error, bukan bug.
    if (statusCode >= 400 && statusCode < 500) return

    // Coba dapetin user dari session.
    let userId: string | undefined
    let userRole: string | undefined
    try {
      const session = await getUserSession(event)
      const u = session?.user as { id?: number; role?: string } | undefined
      if (u?.id != null) {
        userId = String(u.id)
        userRole = u.role
      }
    } catch {
      // session not available / not authenticated — anonymous error
    }

    const props: Record<string, unknown> = {
      $process_person_profile: !!userId,
      path: event.path,
      method: event.method,
      status_code: statusCode,
    }
    if (userId) props.user_id = userId
    if (userRole) props.user_role = userRole

    // distinctId: kalau user login, pakai id-nya supaya error ter-link ke session
    // PostHog yang sama. Kalau anonymous, biarkan PostHog generate.
    client.captureException(error, userId, props)
  })

  nitroApp.hooks.hook('close', async () => {
    await client.shutdown()
  })
})
