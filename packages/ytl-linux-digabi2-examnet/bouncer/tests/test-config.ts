import { randomUUID } from 'node:crypto'
import { Config, ConfigSchema } from '../src/config.ts'

export const config = ConfigSchema.parse({
  canonicalHostname: randomUUID(),
  friendlyName: randomUUID(),
  ncsiHostnames: [randomUUID()],
  ports: { discovery: 26464, bouncer: 80 },
  searchDomain: randomUUID(),
  serverOwnIp: randomUUID()
} satisfies Config)
