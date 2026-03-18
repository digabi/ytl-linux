import { parseArgs } from '@std/cli'
import { z } from '@zod/zod/v4-mini'
import { bouncerApp } from './bouncer.ts'
import { Config, ConfigInputFilesSchema, ConfigSchema, SecretsSchema } from './config.ts'
import { discoveryApp } from './discovery.ts'
import { loggingMiddleware } from './logging.ts'
import logger from './logger.ts'

const ArgsSchema = z.partial(
  z.object({
    'friendly-name-file': z.string(),
    'ncsi-hostnames-file': z.string(),
    'dns-hostname-file': z.string(),
    'dns-records-file': z.string(),
    'dns-search-domain': z.string(),
    'discovery-port': z.coerce.number(),
    'discovery-path': z.string(),
    'discovery-interval-ms': z.coerce.number(),
    'bouncer-port': z.coerce.number(),
    'tls-cert-file': z.string(),
    'tls-key-file': z.string(),
    'server-own-ip-file': z.string(),
    'dnsmasq-config-file': z.string()
  })
)
const args = ArgsSchema.parse(parseArgs(Deno.args))

const configFromFiles = await ConfigInputFilesSchema.parseAsync({
  friendlyName: args['friendly-name-file'],
  ncsiHostnames: args['ncsi-hostnames-file'],
  canonicalHostname: args['dns-hostname-file'],
  serverOwnIp: args['server-own-ip-file']
})

const config = ConfigSchema.parse({
  // Arguments that must be set by the caller (+ TLS cert)
  ...configFromFiles,
  searchDomain: args['dns-search-domain'],
  // Optional configuration that has defaults
  ports: {
    discovery: args['discovery-port'] ?? 26464,
    bouncer: args['bouncer-port'] ?? 80
  }
})

logger.info(config, `Starting digabi2-examnet-bouncer with config:`)

const secrets = await SecretsSchema.parseAsync({
  key: args['tls-key-file'],
  cert: args['tls-cert-file']
})

const _discoveryServer = Deno.serve(
  {
    port: config.ports.discovery,
    cert: secrets.cert,
    key: secrets.key
  },
  loggingMiddleware(discoveryApp(config))
)

const _bouncerServer = Deno.serve(
  {
    port: config.ports.bouncer
  },
  loggingMiddleware(bouncerApp(config))
)
