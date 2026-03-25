import _ from 'lodash'
import { z } from '@zod/zod/v4-mini'
import logger from './logger.ts'
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

export async function fetchFromDiscoveryEndpoint(ktpDomain: string, config: Config) {
  const discoveryUrl = `https://${ktpDomain}:${config.ports.discovery}${DISCOVERY_PATH}`
  logger.debug(`Asking ${ktpDomain} for alias using URL ${discoveryUrl}`)
  return await fetch(discoveryUrl)
}

export async function discoverFriendlyNamesInNetwork(
  config: Config,
  fetchFn = fetchFromDiscoveryEndpoint
): Promise<DiscoveredKTP[]> {
  const discovered: DiscoveredKTP[] = []

  for (const ktpDomain of config.ktpDomains) {
    try {
      const response = await fetchFn(ktpDomain, config)

      if (!response.ok) {
        logger.warn(`${ktpDomain} responded with ${response.status} ${response.statusText}, skipping it`)
        logger.warn(`Response body: ${await response.text()}`)
        continue
      }

      const responseJson = await response.json()
      const discoveryResponse = DiscoveryResponseSchema.safeParse(responseJson)

      if (!discoveryResponse.success) {
        logger.warn(`${ktpDomain} responded with invalid JSON shape, skipping it`)
        logger.warn(`Response body: ${JSON.stringify(responseJson)}`)
        continue
      }

      const { target, alias } = discoveryResponse.data

      logger.debug(`${ktpDomain} declares alias ${alias} => ${target}`)

      discovered.push({
        address: ktpDomain,
        target,
        alias
      })
    } catch (err) {
      logger.debug(`${ktpDomain} did not respond validly, assuming it's down or otherwise unreachable`)
      logger.debug(`Error message: ${err instanceof Error ? err.message : err}`)
      logger.trace(err, `Exact error:`)
    }
  }

  return Object.values(discovered)
}
