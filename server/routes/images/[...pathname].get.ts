import { getServerLogger, markErrorLogged, serializeError } from '#server/utils/logger'
import { serveR2MediaObject } from '#server/utils/r2Media'

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  if (!pathname) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  try {
    const object = await serveR2MediaObject(event, pathname)
    if (!object) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    return object
  }
  catch (error) {
    const logger = await getServerLogger()
    logger.error({
      err: serializeError(error),
      pathname,
      method: event.method,
      path: event.path,
    }, 'failed to serve image blob')
    markErrorLogged(error)

    throw error
  }
})
