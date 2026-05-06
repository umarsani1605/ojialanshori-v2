import { blob } from '@nuxthub/blob'
import { getServerLogger, markErrorLogged, serializeError } from '#server/utils/logger'
import { serveR2MediaObject } from '#server/utils/r2Media'

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  if (!pathname) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  try {
    return await blob.serve(event, pathname)
  }
  catch (error) {
    const logger = await getServerLogger()
    const fallbackObject = await serveR2MediaObject(event, pathname)

    if (fallbackObject) {
      logger.warn({
        pathname,
        method: event.method,
        path: event.path,
      }, 'served image blob from R2 fallback')

      return fallbackObject
    }

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
