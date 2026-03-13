import { Config } from './config.ts'

export function discoveryApp(config: Config): (req: Request) => Response {
  const pattern = new URLPattern({
    pathname: '/.well-known/appspecific/net.abitti.koe.v1/self.json'
  })

  return function discoveryHandler(req: Request): Response {
    if (pattern.test(req.url)) {
      return Response.json({
        target: config.dns.domain,
        aliases: config.friendlyNames.map(x => `${x}.${config.dns.searchDomain}`)
      })
    }
    return new Response(null, { status: 404 })
  }
}
