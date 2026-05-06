export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()
  if (!auth.loggedIn.value) return

  if (to.path.startsWith('/admin') && !auth.isAdmin.value)
    return navigateTo(auth.homePath.value)

  if (to.path.startsWith('/dashboard') && auth.isAdmin.value)
    return navigateTo(auth.homePath.value)
})
