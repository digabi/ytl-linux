import { z } from '@zod/zod/v4-mini'

function kebabToCamel(s: string) {
  return s.replaceAll(/-[a-z]/g, s => s.substring(1).toUpperCase())
}

export function transformCase(args: object) {
  return Object.fromEntries(Object.entries(args).map(([k, v]) => [kebabToCamel(k), v]))
}

export const TextFileContentSchema = z.pipe(
  z.string(),
  z.transform(async filename => await Deno.readTextFile(filename))
)

export const TextFileStringSchema = z.pipe(
  TextFileContentSchema,
  z.transform(x => x.trimEnd())
)

export const CommaSeparatedTransform = z.transform((x: string) =>
  x
    .split(',')
    .map(x => x.trim())
    .filter(x => x.length > 0)
)
