import _ from 'lodash'
import { z } from '@zod/zod/v4-mini'
import logger from './logger.ts'
import { Config } from './config.ts'
import { DISCOVERY_PATH } from './constants.ts'
import { sortByKTPNumber } from './util.ts'

export const DiscoveryResponseSchema = z.object({
  target: z.string(),
  alias: z.string()
})

export type DiscoveryResponse = z.infer<typeof DiscoveryResponseSchema>

export const DiscoveredKTPSchema = z.object({
  address: z.string(),
  target: z.string(),
  alias: z.string()
})

export type DiscoveredKTP = z.infer<typeof DiscoveredKTPSchema>

export async function fetchFromDiscoveryEndpoint(ktpDomain: string, config: Config) {
  const discoveryUrl = `https://${ktpDomain}:${config.ports.discovery}${DISCOVERY_PATH}`
  logger.debug(`Asking ${ktpDomain} for alias using URL ${discoveryUrl}`)

  return await fetch(discoveryUrl, {
    signal: AbortSignal.timeout(5000)
  })
}

export async function discoverFriendlyNamesInNetwork(
  config: Config,
  fetchFn = fetchFromDiscoveryEndpoint
): Promise<DiscoveredKTP[]> {
  // Sort the domains so that the logs make a bit more sense, since the certificate SANs are sorted by "natural order" (i.e. 1, 10, 11, ... 2, 20, 21, ...) and not KTP number order
  const ktpDomains = config.ktpDomains.toSorted(sortByKTPNumber)

  const results = await Promise.allSettled(
    ktpDomains.map(async ktpDomain => {
      try {
        const response = await fetchFn(ktpDomain, config)

        if (!response.ok) {
          logger.warn(`${ktpDomain} responded with ${response.status} ${response.statusText}, skipping it`)
          logger.warn(`Response body: ${await response.text()}`)
          return
        }

        const responseJson = await response.json()
        const discoveryResponse = DiscoveryResponseSchema.safeParse(responseJson)

        if (!discoveryResponse.success) {
          logger.warn(`${ktpDomain} responded with invalid JSON shape, skipping it`)
          logger.warn(`Response body: ${JSON.stringify(responseJson)}`)
          return
        }

        const { target, alias } = discoveryResponse.data

        logger.debug(`${ktpDomain} declares alias ${alias} => ${target}`)

        return {
          address: ktpDomain,
          target,
          alias
        }
      } catch (err) {
        logger.debug(`${ktpDomain} did not respond validly, assuming it's down or otherwise unreachable`)
        logger.debug(`Error message: ${err instanceof Error ? err.message : err}`)
        logger.trace(err, `Exact error:`)
        return
      }
    })
  )

  return results.flatMap(x => (x.status === 'fulfilled' ? (x.value ? [x.value] : []) : []))
}
