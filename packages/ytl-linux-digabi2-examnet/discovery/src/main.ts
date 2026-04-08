import logger from './logger.ts'
import { discoverFriendlyNamesInNetwork } from './discovery.ts'
import { writeDnsmasqConfig } from './dnsmasq.ts'
import { parseArgs } from './cli.ts'
import * as db from './db.ts'

const args = parseArgs(Deno.args)
if (!args) Deno.exit(1)
const { config } = args

db.init(config)

logger.info(config, 'Running digabi2-examnet-discovery with config:')

try {
  logger.info(`Running discovery of KTP friendly names in the network`)
  const discovered = await discoverFriendlyNamesInNetwork(config)
  await writeDnsmasqConfig(discovered, config)
} catch (err) {
  logger.fatal(err, `Periodic discovery failed:`)
}

logger.info(`Discovery finished`)
