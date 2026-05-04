//
// This script emulates the behavior of external programs called by the examnet script
//

import fs from 'node:fs'
import path from 'node:path'

async function main() {
  // process.argv[2] is the name of the program being called
  const cmd = path.basename(process.argv[2])
  const argv = process.argv.slice(3)
  const argvString = argv.join(' ')
  const entry = { cmd, argv }
  fs.appendFileSync(process.env.CALLS_LOG, JSON.stringify(entry) + '\n')
  switch (cmd) {
    case 'ip':
      if (argvString === '-oneline -4 addr show scope global eth0') {
        console.log('10.0.10.1')
      } else {
        console.log('')
      }
      break
    case 'stat':
      console.log('nobody:nobody')
      break
    case 'ytl-linux-digabi2-bouncer':
      // simulate a daemon that stays running by waiting for two minutes
      await new Promise(resolve => setTimeout(resolve, 120_000))
      break
    case 'systemctl':
      if (argvString.includes('is-enabled')) {
        console.log('enabled')
      } else {
        console.log('')
      }
      break
    case 'openssl':
      console.log(
        '                DNS:999.koe.abitti.net, DNS:ktp1.999.koe.abitti.net, DNS:ktp10.999.koe.abitti.net, DNS:ktp11.999.koe.abitti.net, DNS:ktp12.999.koe.abitti.net, DNS:ktp13.999.koe.abitti.net, DNS:ktp14.999.koe.abitti.net, DNS:ktp15.999.koe.abitti.net, DNS:ktp16.999.koe.abitti.net, DNS:ktp17.999.koe.abitti.net, DNS:ktp18.999.koe.abitti.net, DNS:ktp19.999.koe.abitti.net, DNS:ktp2.999.koe.abitti.net, DNS:ktp20.999.koe.abitti.net, DNS:ktp21.999.koe.abitti.net, DNS:ktp22.999.koe.abitti.net, DNS:ktp23.999.koe.abitti.net, DNS:ktp24.999.koe.abitti.net, DNS:ktp3.999.koe.abitti.net, DNS:ktp4.999.koe.abitti.net, DNS:ktp5.999.koe.abitti.net, DNS:ktp6.999.koe.abitti.net, DNS:ktp7.999.koe.abitti.net, DNS:ktp8.999.koe.abitti.net, DNS:ktp9.999.koe.abitti.net'
      )
      break
    case 'iptables':
      // TODO mock script would need to be stateful to support testing of adding and deleting rules
      console.log('')
      break
  }
}

main()
