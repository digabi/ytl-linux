import { exists } from '@std/fs'
import _ from 'lodash'
import process from 'node:process'
import { Config } from './config.ts'
import { DiscoveredKTP } from './discovery.ts'
import logger from './logger.ts'
import * as db from './db.ts'

async function restartDnsmasq(config: Config) {
  logger.debug('Restarting dnsmasq')

  if (process.platform !== 'linux') {
    logger.warn(`Since this is not a Linux system, there is no dnsmasq to restart, but let's pretend we did`)
    return
  }

  if (!config.isProd) {
    logger.warn(`Since we're not running in production, let's not restart dnsmasq but just pretend we did`)
    return
  }

  const command = new Deno.Command('systemctl', { args: ['restart', 'dnsmasq'] })
  const { code } = await command.output()

  if (code !== 0) {
    logger.fatal(`Failed to restart dnsmasq, exit code ${code}`)
    return
  }

  logger.info(`Dnsmasq restarted successfully`)
}

async function removeDnsmasqConfig(config: Config) {
  if (!(await exists(config.dnsmasqConfigOutputFile))) {
    logger.info(`No dnsmasq config file ${config.dnsmasqConfigOutputFile} found, will not attempt removal`)
    return
  }

  logger.info(`Removing dnsmasq config file ${config.dnsmasqConfigOutputFile}`)

  try {
    await Deno.remove(config.dnsmasqConfigOutputFile)
  } catch (err) {
    logger.fatal(err, `Failed to remove dnsmasq config file ${config.dnsmasqConfigOutputFile}`)
  }
}

export async function writeDnsmasqConfig(discovered: DiscoveredKTP[], config: Config) {
  // Write entire scan result, including duplicates, to DB so we can always see the raw situation
  db.upsertFriendlyNames(discovered)

  // Read back the results from the DB so we can also include KTPs that were not online when this scan happened,
  // and only then dedupe them so that we don't confuse dnsmasq
  const allFriendlyNames = db.getFriendlyNames()

  if (Deno.env.get('CONSOLE_ONLY_OUTPUT') === 'true') {
    logger.info(`Console only output mode enabled, will not write any files and outputting results directly to stdout`)
    console.log(JSON.stringify({ discovered: allFriendlyNames }, null, 2))
    return
  }

  const hostRecordEntries = allFriendlyNames.map(x => `host-record=${x.alias},${x.target}`)

  if (hostRecordEntries.length === 0) {
    logger.info(
      `No KTPs were discovered, removing DNS records file ${config.dnsmasqConfigOutputFile} if it exists to ensure clean state`
    )
    await removeDnsmasqConfig(config)
    return
  }

  logger.debug(hostRecordEntries, `Generated the following DNS records:`)

  const content = hostRecordEntries.join('\n')

  if (await exists(config.dnsmasqConfigOutputFile)) {
    const existingContent = await Deno.readTextFile(config.dnsmasqConfigOutputFile)

    if (existingContent === content) {
      logger.debug(`DNS records are already up to date, no need to update`)
      return
    }
  }

  logger.info(`Updating DNS records`)
  await Deno.writeTextFile(config.dnsmasqConfigOutputFile, content)
  logger.info(`DNS records successfully updated`)

  await restartDnsmasq(config)
}
