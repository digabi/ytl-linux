import { expect } from '@std/expect'
import { bouncerApp } from '../src/bouncer.ts'
import { config } from './test-config.ts'

const app = bouncerApp(config)

Deno.test('NCSI handler responds correctly', async () => {
  {
    const resp = app(new Request(`http://${config.ncsiHostnames[0]}/connecttest.txt`))
    expect(resp.ok).toBe(true)
    expect(await resp.text()).toBe('Microsoft Connect Test')
  }
  {
    const resp = app(new Request(`http://${config.ncsiHostnames[0]}/ncsi.txt`))
    expect(resp.ok).toBe(true)
    expect(await resp.text()).toBe('Microsoft NCSI')
  }
  {
    const resp = app(new Request(`http://${config.ncsiHostnames[0]}/`))
    expect(resp.ok).toBe(false)
  }
})

Deno.test('Redirect handler responds correctly', () => {
  {
    const resp = app(new Request(`http://${config.friendlyName}.${config.searchDomain}/valvoja`))
    expect(resp.status).toBe(307)
    expect(resp.headers.get('location')).toBe(`https://${config.canonicalHostname}/`)
  }
  {
    const resp = app(new Request(`http://${config.friendlyName}.${config.searchDomain}/koe`))
    expect(resp.status).toBe(307)
    expect(resp.headers.get('location')).toBe(`https://${config.canonicalHostname}:8010/`)
  }
  {
    const resp = app(new Request(`http://${config.friendlyName}.${config.searchDomain}/ktp/hello`, { method: 'POST' }))
    expect(resp.status).toBe(307)
    expect(resp.headers.get('location')).toBe(`https://${config.canonicalHostname}:8010/ktp/hello`)
  }
  {
    // for completeness -- we don't want this to be a generic redirect handler
    const resp = app(new Request(`http://${config.friendlyName}.${config.searchDomain}/ktp/healthcheck`))
    expect(resp.status).toBe(404)
  }
})
