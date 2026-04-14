//
// This script emulates the behavior of external programs called by the examnet script
//

import fs from 'node:fs'
import path from 'node:path'

async function main() {
  // process.argv[2] is the name of the program being called
  const cmd = path.basename(process.argv[2])
  const entry = {
    cmd,
    argv: process.argv.slice(3)
  }
  fs.appendFileSync(process.env.CALLS_LOG, JSON.stringify(entry) + '\n')
  switch (cmd) {
    case 'ip':
      console.log(process.argv[9] === 'eth0' ? '127.0.0.1' : '')
      break
    case 'stat':
      console.log('nobody:nobody')
      break
    case 'ytl-linux-digabi2-bouncer':
      // simulate a daemon that stays running by waiting for two minutes
      await new Promise(resolve => setTimeout(resolve, 120_000))
      break
  }
}

main()
