import { getServerLogger, serializeError, wasErrorLogged } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event }) => {
    if (wasErrorLogged(error)) {
      return
    }

    const logger = await getServerLogger()

    logger.error({
      err: serializeError(error),
      method: event?.method,
      path: event?.path,
    }, 'unhandled server error')
  })
})
