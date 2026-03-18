import { z } from '@zod/zod/v4-mini'
import { CommaSeparatedTransform, TextFileContentSchema, TextFileStringSchema } from './cli-transform.ts'

export const CLIParamsSchema = z.object({
  friendlyName: z.optional(z.string()),
  friendlyNameFile: z.optional(TextFileStringSchema),

  dnsHostname: z.optional(z.string()),
  dnsHostnameFile: z.optional(TextFileStringSchema),
  dnsSearchDomain: z.string(),

  ncsiHostnames: z.optional(z.pipe(z.string(), CommaSeparatedTransform)),
  ncsiHostnamesFile: z.optional(z.pipe(TextFileStringSchema, CommaSeparatedTransform)),

  serverOwnIp: z.optional(z.string()),
  serverOwnIpFile: z.optional(TextFileStringSchema),

  discoveryPort: z.optional(z.coerce.number()),
  bouncerPort: z.optional(z.coerce.number()),

  tlsCertFile: TextFileContentSchema,
  tlsKeyFile: TextFileContentSchema
})
export type CLIParams = z.output<typeof CLIParamsSchema>
