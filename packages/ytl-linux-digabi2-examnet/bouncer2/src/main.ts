import { bouncerApp } from './bouncer.ts'
import { discoveryApp } from './discovery.ts'
import { loggingMiddleware } from './logging.ts'
import logger from './logger.ts'
import { parseArgs } from './cli.ts'

const args = parseArgs(Deno.args)
if (!args) Deno.exit(1)
const { config, secrets } = args

logger.info(config, 'Starting digabi2-examnet-bouncer with config:')

const _discoveryServer = Deno.serve(
  {
    port: config.ports.discovery,
    cert: await Deno.readTextFile(secrets.cert),
    key: await Deno.readTextFile(secrets.key)
  },
  loggingMiddleware(discoveryApp(config))
)

const _bouncerServer = Deno.serve(
  {
    port: config.ports.bouncer
  },
  loggingMiddleware(bouncerApp(config))
)
