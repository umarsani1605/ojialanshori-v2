import { getRoleCluster, getRoleHomePath, getRoleProfilePath } from '~/utils/roleRoute'

export function useAuth() {
  const { user, loggedIn, clear, fetch } = useUserSession()
  const role = computed(() => user.value?.role)

  return {
    user,
    role,
    loggedIn,
    fetch,
    isAdmin: computed(() => user.value?.role === 'admin'),
    isReviewer: computed(() => user.value?.role === 'reviewer'),
    isSantri: computed(() => user.value?.role === 'santri'),
    canReview: computed(() => ['admin', 'reviewer'].includes(user.value?.role ?? '')),
    canWritePenaSantri: computed(() => user.value?.role === 'santri'),
    canManageBerita: computed(() => user.value?.role === 'admin'),
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
