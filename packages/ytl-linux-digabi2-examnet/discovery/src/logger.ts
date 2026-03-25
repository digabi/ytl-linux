import pino from 'pino'
import pretty from 'pino-pretty'

const logger = pino({ level: Deno.env.get('LOG_LEVEL') ?? 'debug' }, pretty())

export default logger
