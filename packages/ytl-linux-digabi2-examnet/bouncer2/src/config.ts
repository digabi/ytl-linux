import { z } from '@zod/zod/v4-mini'

export const ConfigSchema = z.object({
  friendlyName: z.string(),
  canonicalHostname: z.string(),
  ncsiHostnames: z.array(z.string()),
  searchDomain: z.string(),
  serverOwnIp: z.string(),
  ports: z.object({
    discovery: z.int().check(z.minimum(1), z.maximum(0xffff)),
    bouncer: z.int().check(z.minimum(1), z.maximum(0xffff))
  })
})
export type Config = z.output<typeof ConfigSchema>

export const SecretsSchema = z.object({
  key: z.string(),
  cert: z.string()
})
export type Secrets = z.output<typeof SecretsSchema>
