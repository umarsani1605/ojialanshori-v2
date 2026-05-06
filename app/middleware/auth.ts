export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  const isProtectedPage = to.path === '/dashboard'
    || to.path.startsWith('/dashboard/')
    || to.path === '/admin'
    || to.path.startsWith('/admin/')

  if (isProtectedPage && !loggedIn.value) {
    return navigateTo('/masuk')
  }
})
