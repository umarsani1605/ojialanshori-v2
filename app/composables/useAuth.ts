import { getRoleCluster, getRoleHomePath, getRoleProfilePath } from '~/utils/roleRoute'

/**
 * Exposes reactive authentication state, role-based flags, and a logout action for the current user session.
 *
 * @returns An object with:
 * - `user`: reactive current user object
 * - `loggedIn`: reactive boolean indicating authentication state
 * - `fetch`: session-aware fetch helper
 * - `isSuperadmin`, `isPengurus`, `isReviewer`, `isSantri`: computed booleans for exact role checks
 * - `isAdmin`: computed boolean true when role is `superadmin` or `pengurus`
 * - `canPublish`, `canReview`: computed booleans true when role is `superadmin`, `pengurus`, or `reviewer`
 * - `logout()`: async function that posts to `/api/auth/logout`, clears the session, and navigates to `/masuk`
 */
export function useAuth() {
  const { user, loggedIn, clear, fetch } = useUserSession()
  const role = computed(() => user.value?.role)

  return {
    user,
    role,
    loggedIn,
    fetch,
    isSuperadmin: computed(() => user.value?.role === 'superadmin'),
    isPengurus: computed(() => user.value?.role === 'pengurus'),
    isReviewer: computed(() => user.value?.role === 'reviewer'),
    isSantri: computed(() => user.value?.role === 'santri'),
    isAdmin: computed(() => ['superadmin', 'pengurus'].includes(user.value?.role ?? '')),
    canPublish: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(user.value?.role ?? '')),
    canReview: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(user.value?.role ?? '')),
    canWritePosts: computed(() => user.value?.role === 'santri'),
    cluster: computed(() => getRoleCluster(role.value)),
    homePath: computed(() => getRoleHomePath(role.value)),
    profilePath: computed(() => getRoleProfilePath(role.value)),
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clear()
      await navigateTo('/masuk')
    },
  }
}
