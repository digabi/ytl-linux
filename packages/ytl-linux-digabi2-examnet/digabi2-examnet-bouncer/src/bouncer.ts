import { match } from '@gabriel/ts-pattern'
import { Config } from './config.ts'

export function bouncerApp(config: Config): (req: Request) => Response {
  const { ncsiHostnames, friendlyNames } = config
  const friendlyHostnames = friendlyNames.map(x => `${x}.${config.dns.searchDomain}`)

  return function bouncerHandler(req: Request): Response {
    const url = new URL(req.url)
    return match(url.hostname)
      .when(
        x => friendlyHostnames.includes(x),
        () => redirectHandler(req)
      )
      .when(
        x => ncsiHostnames.includes(x),
        () => ncsiHandler(req)
      )
      .otherwise(() => new Response(null, { status: 404 }))
  }

  function ncsiHandler(req: Request): Response {
    const url = new URL(req.url)
    return match(url.pathname)
      .with('/connecttest.txt', () => new Response('Microsoft Connect Test'))
      .with('/ncsi.txt', () => new Response('Microsoft NCSI'))
      .otherwise(() => new Response(null, { status: 404 }))
  }

  function redirectHandler(req: Request): Response {
    const url = new URL(req.url)
    return match([req.method, url.pathname.replace(/\/$/, '')])
      .with(['GET', '/valvoja'], () => {
        const targetURL = new URL(url)
        targetURL.protocol = 'https'
        targetURL.host = config.dns.domain
        targetURL.pathname = '/'
        return redirect(targetURL)
      })
      .with(['GET', '/'], () => {
        const targetURL = new URL(url)
        targetURL.protocol = 'https'
        targetURL.hostname = config.dns.domain
        targetURL.port = '8010'
        return redirect(targetURL)
      })
      .with(['POST', '/ktp/hello'], () => {
        const targetURL = new URL(url)
        targetURL.protocol = 'https'
        targetURL.hostname = config.dns.domain
        targetURL.port = '8010'
        return redirect(targetURL)
      })
      .otherwise(() => new Response(null, { status: 404 }))
  }
}

function redirect(targetURL: URL) {
  return new Response(null, {
    status: 307,
    headers: {
      'Access-Control-Allow-Origin': '*',
      Location: targetURL.toString()
    }
  })
}
