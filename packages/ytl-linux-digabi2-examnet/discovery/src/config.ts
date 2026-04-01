import { z } from '@zod/zod'

export const ConfigSchema = z.object({
  isProd: z.boolean(),
  ktpDomains: z.array(z.string()),
  dnsmasqConfigOutputFile: z.string(),
  ports: z.object({
    discovery: z.int().gte(1).lte(0xffff),
  }),
  dbPath: z.string()
})

export type Config = z.output<typeof ConfigSchema>
