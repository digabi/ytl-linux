import { Config, ConfigSchema } from '../src/config.ts'
import { DiscoveryResponse } from '../src/discovery.ts'

export const config = ConfigSchema.parse({
  isProd: false,
  dnsmasqConfigOutputFile: 'devconf/test__ytl-linux-ktp-aliases.conf',
  ktpDomains: Array(24)
    .fill(undefined)
    .map((_, i) => `ktp${i + 1}.1000.koe.abitti.net`),
  ports: { discovery: 26464 },
  dbPath: 'devconf/test__discovery.db'
} satisfies Config)

export const FAKE_KTPS: Record<string, DiscoveryResponse> = {
  'ktp1.1000.koe.abitti.net': { target: '192.168.10.1', alias: 'peruna.internal' },
  'ktp2.1000.koe.abitti.net': { target: '192.168.20.1', alias: 'nauris.internal' },
  'ktp3.1000.koe.abitti.net': { target: '192.168.30.1', alias: 'turnipsi.internal' },
  'ktp4.1000.koe.abitti.net': { target: '192.168.40.1', alias: 'porkkana.internal' },
  'ktp5.1000.koe.abitti.net': { target: '192.168.50.1', alias: 'lanttu.internal' },
  'ktp6.1000.koe.abitti.net': { target: '192.168.60.1', alias: 'retiisi.internal' },
  'ktp7.1000.koe.abitti.net': { target: '192.168.70.1', alias: 'purjo.internal' },
  'ktp8.1000.koe.abitti.net': { target: '192.168.80.1', alias: 'sipuli.internal' },
  'ktp9.1000.koe.abitti.net': { target: '192.168.90.1', alias: 'kukkakaali.internal' },
  'ktp10.1000.koe.abitti.net': { target: '192.168.100.1', alias: 'paprika.internal' },
  'ktp11.1000.koe.abitti.net': { target: '192.168.110.1', alias: 'salaatti.internal' },
  'ktp12.1000.koe.abitti.net': { target: '192.168.120.1', alias: 'kaali.internal' },
  'ktp13.1000.koe.abitti.net': { target: '192.168.130.1', alias: 'tomaatti.internal' },
  'ktp14.1000.koe.abitti.net': { target: '192.168.140.1', alias: 'kurkku.internal' },
  'ktp15.1000.koe.abitti.net': { target: '192.168.150.1', alias: 'kurpitsa.internal' },
  'ktp16.1000.koe.abitti.net': { target: '192.168.160.1', alias: 'papu.internal' },
  'ktp17.1000.koe.abitti.net': { target: '192.168.170.1', alias: 'herne.internal' },
  'ktp18.1000.koe.abitti.net': { target: '192.168.180.1', alias: 'chili.internal' },
  'ktp19.1000.koe.abitti.net': { target: '192.168.190.1', alias: 'parsa.internal' },
  'ktp20.1000.koe.abitti.net': { target: '192.168.200.1', alias: 'artisokka.internal' },
  'ktp21.1000.koe.abitti.net': { target: '192.168.210.1', alias: 'endiivi.internal' },
  'ktp22.1000.koe.abitti.net': { target: '192.168.220.1', alias: 'avokado.internal' },
  'ktp23.1000.koe.abitti.net': { target: '192.168.230.1', alias: 'munakoiso.internal' },
  'ktp24.1000.koe.abitti.net': { target: '192.168.240.1', alias: 'sokerijuurikas.internal' }
}
