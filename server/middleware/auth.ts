const PUBLIC_API_PREFIXES = ['/api/public/', '/api/auth/', '/api/health']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const isNonPublicApi = path.startsWith('/api/')
    && !PUBLIC_API_PREFIXES.some(prefix => path.startsWith(prefix))
  const isProtectedPage = path.startsWith('/dashboard') || path.startsWith('/admin')

  if (isNonPublicApi || isProtectedPage) {
    const session = await getUserSession(event)
    if (session?.user) event.context.user = session.user
  }
})
