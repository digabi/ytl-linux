import logger from './logger.ts'

export function loggingMiddleware(internal: Deno.ServeHandler<Deno.NetAddr>): Deno.ServeHandler<Deno.NetAddr> {
  return async (req, info) => {
    const response = await internal(req, info)
    const { method, url } = req
    const userAgent = req.headers.get('user-agent')
    info.completed.then(() => {
      logger.info({
        method,
        url,
        userAgent,
        status: response.status
      })
    })
    return response
  }
}
