export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const isDashboardApi = path === '/api/dashboard' || path.startsWith('/api/dashboard/')

  if (isDashboardApi) {
    const { user } = await requireUserSession(event)
    event.context.user = user
  }
  else {
    const session = await getUserSession(event)
    if (session?.user) event.context.user = session.user
  }
})
