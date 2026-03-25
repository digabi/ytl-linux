import { describe, it, beforeEach } from '@std/testing/bdd'
import { assertSnapshot } from '@std/testing/snapshot'
import { ensureDir, emptyDir } from '@std/fs'
import { DiscoveredKTP } from '../src/discovery.ts'
import { writeDnsmasqConfig } from '../src/dnsmasq.ts'
import { config } from './test-config.ts'

describe('dnsmasq config generation', () => {
  beforeEach(async () => {
    await emptyDir('devconf')
    await ensureDir('devconf')
  })

  it('writes valid dnsmasq configuration for detected KTPs', async ctx => {
    const discovered: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' },
      { address: 'ktp3.1000.koe.abitti.net', target: '192.168.30.1', alias: 'turnipsi.internal' }
    ]

    await writeDnsmasqConfig(discovered, config)
    await assertSnapshot(ctx, await Deno.readTextFile(config.dnsmasqConfigOutputFile))
  })

  it('ignores KTPs that have the same alias declared', async ctx => {
    const discovered: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' },
      { address: 'ktp3.1000.koe.abitti.net', target: '192.168.30.1', alias: 'turnipsi.internal' },
      { address: 'ktp4.1000.koe.abitti.net', target: '192.168.40.1', alias: 'peruna.internal' }
    ]

    await writeDnsmasqConfig(discovered, config)
    await assertSnapshot(ctx, await Deno.readTextFile(config.dnsmasqConfigOutputFile))
  })
})
