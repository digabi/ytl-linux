export function loggingMiddleware(internal: Deno.ServeHandler<Deno.NetAddr>): Deno.ServeHandler<Deno.NetAddr> {
  // not exactly paste.TransLogger but probably Close Enough™
  return async (req, info) => {
    const response = await internal(req, info)
    const authorization = req.headers.get('authorization')
    const now = Temporal.Now.instant()

    const remoteAddr = info.remoteAddr.hostname
    const remoteUser = authorization?.startsWith('Basic ')
      ? (atob(authorization.substring(6)).split(':')[0] ?? '-')
      : '-'
    const time = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: false
    })
    const requestMethod = req.method
    const requestURI = req.url
    const status = response.status
    const bytes = (await response.clone().arrayBuffer()).byteLength
    const httpReferer = req.headers.get('referer') ?? '-'
    const httpUserAgent = req.headers.get('user-agent') ?? '-'

    console.log(
      `${remoteAddr} - ${remoteUser} [${time}] "${requestMethod} ${requestURI}" ${status} ${bytes} "${httpReferer}" "${httpUserAgent}"`
    )
    return response
  }
}
