import { DatabaseSync } from 'node:sqlite'
import { Config } from './config.ts'
import { DiscoveredKTP } from './discovery.ts'
import logger from './logger.ts'

let db: DatabaseSync

export function init(config: Config) {
  db = new DatabaseSync(config.dbPath)
  create()
}

export function create() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ktp_friendly_names (
      address TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      alias TEXT NOT NULL,
      last_seen DATETIME NOT NULL
    )
  `)
}

export function reset() {
  db.exec(`DROP TABLE IF EXISTS ktp_friendly_names`)
  create()
}

export function upsertFriendlyNames(result: DiscoveredKTP[]) {
  logger.info(`Upserting discovered KTP friendly names to DB`)

  for (const ktp of result) {
    logger.debug(`Upserting ${ktp.address} friendly name ${ktp.alias} => ${ktp.target} to DB`)

    db.prepare(
      `
      INSERT INTO ktp_friendly_names (address, target, alias, last_seen) VALUES (?, ?, ?, datetime('now', 'subsec'))
      ON CONFLICT (address) DO UPDATE SET target = excluded.target, alias = excluded.alias, last_seen = excluded.last_seen
    `
    ).run(ktp.address, ktp.target, ktp.alias)
  }
}

export function getFriendlyNames(): DiscoveredKTP[] {
  return db
    .prepare(`SELECT address, target, alias, last_seen FROM ktp_friendly_names ORDER BY address `)
    .all()
    .map(
      ({ address, target, alias }) =>
        ({
          address,
          target,
          alias
        }) as DiscoveredKTP
    )
}
