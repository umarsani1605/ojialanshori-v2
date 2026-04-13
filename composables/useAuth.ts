export function useAuth() {
  const { user, loggedIn, clear, fetch } = useUserSession()

  return {
    user,
    loggedIn,
    fetch,
    isSuperadmin: computed(() => user.value?.role === 'superadmin'),
    isPengurus: computed(() => user.value?.role === 'pengurus'),
    isReviewer: computed(() => user.value?.role === 'reviewer'),
    isSantri: computed(() => user.value?.role === 'santri'),
    isAdmin: computed(() => ['superadmin', 'pengurus'].includes(user.value?.role ?? '')),
    canPublish: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(user.value?.role ?? '')),
    canReview: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(user.value?.role ?? '')),
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clear()
      await navigateTo('/masuk')
    },
  }
}
