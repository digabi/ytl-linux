import { z } from '@zod/zod/v4-mini'

export const ConfigSchema = z.object({
  isProd: z.boolean(),
  ktpDomains: z.array(z.string()),
  dnsmasqConfigOutputFile: z.string(),
  ports: z.object({
    discovery: z.int().check(z.minimum(1), z.maximum(0xffff))
  })
})

export type Config = z.output<typeof ConfigSchema>
