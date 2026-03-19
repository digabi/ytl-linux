import { match } from '@gabriel/ts-pattern'
import { Config } from './config.ts'

export function bouncerApp(config: Config): (req: Request) => Response {
  const { ncsiHostnames, friendlyName } = config
  const friendlyHostname = `${friendlyName}.${config.searchDomain}`

  return function bouncerHandler(req: Request): Response {
    const url = new URL(req.url)
    return match(url.hostname)
      .when(
        x => x === friendlyHostname || x === friendlyName,
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
        targetURL.host = config.canonicalHostname
        targetURL.pathname = '/'
        return redirect(targetURL)
      })
      .with(['GET', '/koe'], () => {
        const targetURL = new URL(url)
        targetURL.protocol = 'https'
        targetURL.hostname = config.canonicalHostname
        targetURL.port = '8010'
        targetURL.pathname = '/'
        return redirect(targetURL)
      })
      .with(['POST', '/ktp/hello'], () => {
        const targetURL = new URL(url)
        targetURL.protocol = 'https'
        targetURL.hostname = config.canonicalHostname
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
