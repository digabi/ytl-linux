import { z } from '@zod/zod/v4-mini'

const TextFileContentSchema = z.pipe(
  z.string(),
  z.transform(async filename => await Deno.readTextFile(filename))
)

export const CommaSeparatedTransform = z.transform((x: string) =>
  x
    .split(',')
    .map(x => x.trim())
    .filter(x => x.length > 0)
)

export const ConfigInputFilesSchema = z.object({
  friendlyName: z.pipe(
    TextFileContentSchema,
    z.transform(x => x.trim())
  ),
  ncsiHostnames: z.pipe(TextFileContentSchema, CommaSeparatedTransform),
  canonicalHostname: z.pipe(
    TextFileContentSchema,
    z.transform(x => x.trim())
  ),
  serverOwnIp: z.pipe(
    TextFileContentSchema,
    z.transform(x => x.trim())
  )
})

export const ConfigSchema = z.object({
  friendlyName: z.string(),
  ncsiHostnames: z.array(z.string()),
  searchDomain: z.string(),
  canonicalHostname: z.string(),
  ports: z.object({
    discovery: z.int().check(z.minimum(1), z.maximum(0xffff)),
    bouncer: z.int().check(z.minimum(1), z.maximum(0xffff))
  }),
  serverOwnIp: z.string()
})
export type Config = z.output<typeof ConfigSchema>

export const SecretsSchema = z.object({
  key: TextFileContentSchema,
  cert: TextFileContentSchema
})
export type Secrets = z.output<typeof SecretsSchema>
