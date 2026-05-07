export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const isDashboardApi = path === '/api/dashboard' || path.startsWith('/api/dashboard/')
  const isAdminApi = path === '/api/admin' || path.startsWith('/api/admin/')
  const isProtectedPage = path === '/dashboard'
    || path.startsWith('/dashboard/')
    || path === '/admin'
    || path.startsWith('/admin/')

  if (isDashboardApi || isAdminApi) {
    const { user } = await requireUserSession(event)
    event.context.user = user
  }
  else if (isProtectedPage) {
    const session = await getUserSession(event)
    if (session?.user) event.context.user = session.user
  }
})
