//
// This script emulates the behavior of external program that does not output anything
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
}

main()
