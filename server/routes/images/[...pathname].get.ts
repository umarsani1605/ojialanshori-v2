export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  if (!pathname) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const config = useRuntimeConfig(event)
  const publicDomain = config.public.r2PublicDomain

  // Redirect ke domain publik
  return sendRedirect(event, `https://${publicDomain}/${pathname}`, 301)
})
