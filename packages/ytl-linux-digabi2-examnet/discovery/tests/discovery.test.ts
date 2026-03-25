import { describe, it, beforeEach } from '@std/testing/bdd'
import { ensureDir, emptyDir } from '@std/fs'
import { assertSnapshot } from '@std/testing/snapshot'
import { fakeDiscoveryResponse } from './util.ts'
import { config, FAKE_KTPS } from './test-config.ts'
import { discoverFriendlyNamesInNetwork } from '../src/discovery.ts'

describe('KTP discovery', () => {
  beforeEach(async () => {
    await ensureDir('devconf')
    await emptyDir('devconf')
  })

  it('queries all discovered KTPs for their friendly name', async ctx => {
    const discovered = await discoverFriendlyNamesInNetwork(config, async ktpDomain =>
      fakeDiscoveryResponse(200, FAKE_KTPS[ktpDomain])
    )

    await assertSnapshot(ctx, discovered)
  })

  it('ignores KTPs that are offline', async ctx => {
    const discovered = await discoverFriendlyNamesInNetwork(config, async ktpDomain => {
      if (ktpDomain.startsWith('ktp1')) {
        return fakeDiscoveryResponse(200, FAKE_KTPS[ktpDomain])
      }

      throw new Error('Simulated network error')
    })

    await assertSnapshot(ctx, discovered)
  })

  it('ignores KTPs that respond with error codes', async ctx => {
    const discovered = await discoverFriendlyNamesInNetwork(config, async ktpDomain => {
      if (ktpDomain.startsWith('ktp2')) {
        return fakeDiscoveryResponse(500, FAKE_KTPS[ktpDomain])
      }

      return fakeDiscoveryResponse(200, FAKE_KTPS[ktpDomain])
    })

    await assertSnapshot(ctx, discovered)
  })

  it('ignores KTPs that respond with invalidly shaped JSON', async ctx => {
    const discovered = await discoverFriendlyNamesInNetwork(config, async ktpDomain => {
      if (ktpDomain.startsWith('ktp1')) {
        return fakeDiscoveryResponse(200, { puppua: 'turska', huutista: 'joka tuutista' })
      }

      return fakeDiscoveryResponse(200, FAKE_KTPS[ktpDomain])
    })

    await assertSnapshot(ctx, discovered)
  })
})
