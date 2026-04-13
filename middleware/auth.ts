export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (to.path.startsWith('/dashboard') && !loggedIn.value) {
    return navigateTo('/masuk')
  }
})
