import { z } from '@zod/zod/v4-mini'
import { ConfigSchema } from './config.ts'
import logger from './logger.ts'

const json = z.codec(z.string(), z.unknown(), {
  decode: (input, ctx) => {
    try {
      return JSON.parse(input)
    } catch (err: unknown) {
      ctx.issues.push({
        code: 'invalid_format',
        format: 'json_string',
        input,
        message: (err as Error).message
      })
      return z.NEVER
    }
  },
  encode: value => JSON.stringify(value)
})

export const CLIParamsSchema = z.pipe(
  json,
  z.object({
    config: ConfigSchema
  })
)

export function parseArgs(args: string[]) {
  const result = z.tuple([CLIParamsSchema]).safeParse(args)
  if (result.success) {
    return result.data[0]
  }
  logger.error(z.prettifyError(result.error))
  return null
}
