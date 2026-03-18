import { expect } from '@std/expect'
import { discoveryApp } from '../src/discovery.ts'
import { config } from './test-config.ts'

const app = discoveryApp(config)

Deno.test('Discovery app returns its details', async () => {
  {
    const resp = app(
      new Request(
        `https://${config.canonicalHostname}:${config.ports.discovery}/.well-known/appspecific/net.abitti.koe.v1/self.json`
      )
    )
    expect(await resp.json()).toStrictEqual({
      target: config.serverOwnIp,
      alias: `${config.friendlyName}.${config.searchDomain}`
    })
  }
  {
    const resp = app(new Request(`https://${config.canonicalHostname}:${config.ports.discovery}/`))
    expect(resp.ok).not.toBe(true)
  }
})
