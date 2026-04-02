import { describe, it, beforeEach } from '@std/testing/bdd'
import { assertSnapshot } from '@std/testing/snapshot'
import { expect } from '@std/expect'
import { ensureDir, emptyDir } from '@std/fs'
import { DiscoveredKTP } from '../src/discovery.ts'
import { writeDnsmasqConfig } from '../src/dnsmasq.ts'
import { config } from './test-config.ts'
import * as db from '../src/db.ts'

describe('dnsmasq config generation', () => {
  beforeEach(async () => {
    await emptyDir('devconf')
    await ensureDir('devconf')
    db.init(config)
  })

  it('writes valid dnsmasq configuration for detected KTPs', async ctx => {
    const discovered: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' },
      { address: 'ktp3.1000.koe.abitti.net', target: '192.168.30.1', alias: 'turnipsi.internal' }
    ]

    await writeDnsmasqConfig(discovered, config)

    await assertSnapshot(ctx, db.getFriendlyNames())
    await assertSnapshot(ctx, await Deno.readTextFile(config.dnsmasqConfigOutputFile))
  })

  it('stores even KTPs that have the same alias declared, but only writes dnsmasq config for ones without duplicates', async ctx => {
    const discovered: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' },
      { address: 'ktp3.1000.koe.abitti.net', target: '192.168.30.1', alias: 'turnipsi.internal' },
      { address: 'ktp4.1000.koe.abitti.net', target: '192.168.40.1', alias: 'peruna.internal' }
    ]

    await writeDnsmasqConfig(discovered, config)

    await assertSnapshot(ctx, db.getFriendlyNames())
    await assertSnapshot(ctx, await Deno.readTextFile(config.dnsmasqConfigOutputFile))
  })

  it('on subsequent scans, previously detected KTPs are included even if they are now offline', async () => {
    const discovered1: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' },
      { address: 'ktp3.1000.koe.abitti.net', target: '192.168.30.1', alias: 'turnipsi.internal' }
    ]

    await writeDnsmasqConfig(discovered1, config)
    expect(db.getFriendlyNames()).toEqual(discovered1)

    const dnsmasq1 = [
      'host-record=peruna.internal,192.168.10.1',
      'host-record=nauris.internal,192.168.20.1',
      'host-record=turnipsi.internal,192.168.30.1'
    ].join('\n')

    expect(await Deno.readTextFile(config.dnsmasqConfigOutputFile)).toEqual(dnsmasq1)

    const discovered2: DiscoveredKTP[] = [
      { address: 'ktp1.1000.koe.abitti.net', target: '192.168.10.1', alias: 'peruna.internal' },
      { address: 'ktp2.1000.koe.abitti.net', target: '192.168.20.1', alias: 'nauris.internal' }
    ]

    await writeDnsmasqConfig(discovered2, config)

    // Result in DB and in dnsmasq should not change, the one previously online should be included
    expect(db.getFriendlyNames()).toEqual(discovered1)
    expect(await Deno.readTextFile(config.dnsmasqConfigOutputFile)).toEqual(dnsmasq1)
  })
})
