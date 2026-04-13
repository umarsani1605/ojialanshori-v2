export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (path === '/api/dashboard' || path.startsWith('/api/dashboard/')) {
    await requireUserSession(event)
  }
})
