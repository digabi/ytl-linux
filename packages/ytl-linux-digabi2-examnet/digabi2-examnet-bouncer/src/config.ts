import { z } from '@zod/zod/v4-mini'

const TextFileContentSchema = z.pipe(
  z.string(),
  z.transform(async filename => await Deno.readTextFile(filename))
)

const CommaSeparatedTransform = z.transform((x: string) => x.split(','))

const DNSSchema = z.object({
  schoolNumber: z.pipe(z.coerce.number(), z.int()),
  serverNumber: z.pipe(z.coerce.number(), z.int().check(z.minimum(1), z.maximum(24))),
  domain: z.string(),
  searchDomain: z.string()
})

export const ConfigSchema = z.object({
  friendlyNames: z.pipe(TextFileContentSchema, CommaSeparatedTransform),
  ncsiHostnames: z.pipe(TextFileContentSchema, CommaSeparatedTransform),
  dns: z.pipe(
    z.pipe(
      TextFileContentSchema,
      z.transform(input => {
        const match = input.trim().match(/^ktp(\d+)\.(\d+)\.([a-z.]+)$/)
        console.log(input)
        const [domain, serverNumber, schoolNumber, searchDomain] = match ?? []
        return { domain, serverNumber, schoolNumber, searchDomain } as unknown
      })
    ),
    DNSSchema
  ),
  ports: z.object({
    discovery: z.int().check(z.minimum(1), z.maximum(0xffff)),
    bouncer: z.int().check(z.minimum(1), z.maximum(0xffff))
  })
})
export type Config = z.output<typeof ConfigSchema>

export const SecretsSchema = z.object({
  key: TextFileContentSchema,
  cert: TextFileContentSchema
})
export type Secrets = z.output<typeof SecretsSchema>
