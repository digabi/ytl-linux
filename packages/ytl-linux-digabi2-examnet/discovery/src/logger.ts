import pino from 'pino'
import pretty from 'pino-pretty'

// When running the discovery in oneshot mode to get its output, we need to direct all logs to stderr so they don't contaminate stdout
const LOG_DESTINATION = Deno.env.get('CONSOLE_ONLY_OUTPUT') === 'true' ? 2 : 1

const logger = pino(
  { level: Deno.env.get('LOG_LEVEL') ?? 'debug' },
  pretty({ destination: LOG_DESTINATION, colorize: true })
)

export default logger
