import { parseArgs } from '@std/cli'
import { bouncerApp } from './bouncer.ts'
import { ConfigSchema, SecretsSchema } from './config.ts'
import { discoveryApp } from './discovery.ts'
import { loggingMiddleware } from './logging.ts'
import { z } from '@zod/zod/v4-mini'

const ArgsSchema = z.partial(
  z.object({
    'friendly-names-file': z.string(),
    'ncsi-hostnames-file': z.string(),
    'dns-hostname-file': z.string(),
    'discovery-port': z.coerce.number(),
    'bouncer-port': z.coerce.number(),
    'tls-cert-file': z.string(),
    'tls-key-file': z.string()
  })
)
const args = ArgsSchema.parse(parseArgs(Deno.args))

const config = await ConfigSchema.parseAsync({
  friendlyNames: args['friendly-names-file'],
  ncsiHostnames: args['ncsi-hostnames-file'],
  dns: args['dns-hostname-file'],
  ports: {
    discovery: args['discovery-port'] ?? 26464,
    bouncer: args['bouncer-port'] ?? 80
  }
})
console.log(config)
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
