import { parseArgs } from '@std/cli'
import { bouncerApp } from './bouncer.ts'
import { Config, ConfigSchema, SecretsSchema } from './config.ts'
import { discoveryApp } from './discovery.ts'
import { loggingMiddleware } from './logging.ts'
import logger from './logger.ts'
import { CLIParamsSchema } from './cli.ts'
import { transformCase } from './cli-transform.ts'

const args = await CLIParamsSchema.parseAsync(transformCase(parseArgs(Deno.args)))

const config = ConfigSchema.parse({
  friendlyName: args.friendlyName ?? args.friendlyNameFile!,
  canonicalHostname: args.dnsHostname ?? args.dnsHostnameFile!,
  ncsiHostnames: args.ncsiHostnames ?? args.ncsiHostnamesFile!,
  searchDomain: args.dnsSearchDomain,
  serverOwnIp: args.serverOwnIp ?? args.serverOwnIpFile!,
  ports: {
    discovery: args.discoveryPort ?? 26464,
    bouncer: args.bouncerPort ?? 80
  }
} satisfies Config)

logger.info(config, `Starting digabi2-examnet-bouncer with config:`)

const secrets = await SecretsSchema.parseAsync({
  key: args.tlsKeyFile,
  cert: args.tlsCertFile
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
