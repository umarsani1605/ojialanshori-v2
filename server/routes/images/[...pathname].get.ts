export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  if (!pathname) throw createError({ statusCode: 404, message: 'Not Found' })

  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return hubBlob().serve(event, pathname)
})
