export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (to.path === '/masuk' && loggedIn.value) {
    return navigateTo('/dashboard')
  }
})
