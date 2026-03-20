import { z } from '@zod/zod/v4-mini'
import _ from 'lodash'
import { Config } from './config.ts'
import { DISCOVERY_PATH } from './constants.ts'

export const DiscoveryResponseSchema = z.object({
  target: z.string(),
  alias: z.string()
})

export type DiscoveryResponse = z.infer<typeof DiscoveryResponseSchema>

export interface DiscoveredKTP {
  address: string
  target: string
  alias: string
}

export function discoveryApp(config: Config): (req: Request) => Response {
  const pattern = new URLPattern({
    pathname: DISCOVERY_PATH
  })

  return function discoveryHandler(req: Request): Response {
    if (pattern.test(req.url)) {
      return Response.json({
        target: config.serverOwnIp,
        alias: `${config.friendlyName}.${config.searchDomain}`
      } satisfies DiscoveryResponse)
    }
    return new Response(null, { status: 404 })
  }
}
