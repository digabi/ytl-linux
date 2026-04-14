import assert from 'node:assert/strict'
import { test, describe, beforeEach } from 'node:test'
import { execa } from 'execa'
import { join } from 'node:path'
import { mkdtemp, writeFile, chmod, readFile, mkdir, truncate, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'

describe('examnet', async () => {
  let callsLog
  let mockBinDir
  let mockConfigDir
  let mockTemplatesDir
  let mockResolvedDir
  let mockDockerDir
  let mockDnsmasqDir
  let mockNaksu2WorkDir
  let mockNaksu2CertsDir

  beforeEach(async () => {
    await truncateCallsLog()
    ;({
      mockBinDir,
      mockConfigDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir
    } = await initTempDir())
  })

  function runExamnet(netDeviceWan: string, netDeviceLan: string, serverNumber: number, serverFriendlyName?: string) {
    return execa(
      './ytl-linux-digabi2-examnet',
      [netDeviceWan, netDeviceLan, `${serverNumber}`, serverFriendlyName, '--not-root'].filter(Boolean),
      {
        env: {
          ...process.env,
          PATH: `${mockBinDir}:${process.env.PATH}`,
          CALLS_LOG: callsLog,
          PATH_EXAMNET_CONFIG: mockConfigDir,
          PATH_TEMPLATES: mockTemplatesDir,
          PATH_RESOLVED: mockResolvedDir,
          PATH_DOCKER: mockDockerDir,
          PATH_DNSMASQ: mockDnsmasqDir,
          NAKSU2_WORKDIR: mockNaksu2WorkDir
        },
        detached: true
      }
    )
  }

  describe('bouncer', async () => {
    test('daemon starts when correct parameters are given', async () => {
      await writeToTempDir(mockConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockConfigDir, 'server-friendly-name', 'foobar')

      // do not await runExamnet, as it stays running in daemon mode
      const subprocess = runExamnet('eth0', 'eth1', 1, '--daemon')
      await waitForLogEntry(callsLog, '"ytl-linux-digabi2-bouncer"')
      await assertCalls([
        { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] },
        { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', 'eth0'] },
        {
          cmd: 'ytl-linux-digabi2-bouncer',
          argv: [
            `    {        "config": {            "friendlyName": "foobar",             "canonicalHostname": "kamreeri-kelvokas.koe.abitti.net",             "ncsiHostnames": ["example.com"],             "searchDomain": "internal",             "serverOwnIp": "127.0.0.1",             "ports": {"discovery": 26464, "bouncer": 80}         },         "secrets": {"cert":"${mockNaksu2CertsDir}/fullchain.pem","key":"${mockNaksu2CertsDir}/key.pem"}     }`
          ]
        }
      ])
      await killSubprocess(subprocess)
    })
  })

  describe('restart-bouncer', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', 1, '--restart-daemon')
      await assertCalls([
        { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet.service'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'] }
      ])
    })
  })

  describe('discovery', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', 1, '--discovery')
      await assertCalls([
        { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] },
        {
          cmd: 'ytl-linux-digabi2-discovery',
          argv: [
            `    {\n        "config": {\n            "isProd": true,\n            "ktpDomains": [],\n            "dnsmasqConfigOutputFile": "${mockDnsmasqDir}/ytl-linux-ktp-aliases.conf",\n            "ports": {"discovery": 26464}\n        }\n    }`
          ]
        }
      ])
    })
  })

  describe('setup', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', 1)
      await assertCalls([
        { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] },
        { cmd: 'ip', argv: ['link', 'show', 'eth0'] },
        { cmd: 'ip', argv: ['link', 'show', 'eth1'] },
        { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', 'eth0'] },
        { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', 'eth1'] },
        { cmd: 'nmcli', argv: ['connection', 'delete', 'yo-eth1'] },
        {
          cmd: 'nmcli',
          argv: [
            'connection',
            'add',
            'type',
            'ethernet',
            'ifname',
            'eth1',
            'con-name',
            'yo-eth1',
            'ip4',
            '192.168.10.1/16',
            'autoconnect',
            'yes',
            'save',
            'yes'
          ]
        },
        { cmd: 'nmcli', argv: ['connection', 'modify', 'yo-eth1', 'ipv6.method', 'disabled'] },
        { cmd: 'nmcli', argv: ['connection', 'up', 'yo-eth1'] },
        { cmd: 'systemctl', argv: ['restart', 'NetworkManager.service'] },
        { cmd: 'nm-online', argv: ['-s', '-q', '--timeout=30'] },
        { cmd: 'ipset', argv: ['create', 'ytl_internet_allowlist', 'hash:ip', 'timeout', '3600', '-exist'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-N', 'YTL_LAN_WAN_IPSET_LOG'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-F', 'YTL_LAN_WAN_IPSET_LOG'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-A',
            'YTL_LAN_WAN_IPSET_LOG',
            '-m',
            'conntrack',
            '--ctstate',
            'NEW',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-m',
            'limit',
            '--limit',
            '10/second',
            '--limit-burst',
            '30',
            '-j',
            'LOG',
            '--log-prefix',
            'YTL ALLOW NEW ',
            '--log-level',
            '6'
          ]
        },
        { cmd: 'iptables', argv: ['-t', 'filter', '-A', 'YTL_LAN_WAN_IPSET_LOG', '-j', 'RETURN'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-N', 'YTL_LAN_WAN_IPSET'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-F', 'YTL_LAN_WAN_IPSET'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-A',
            'YTL_LAN_WAN_IPSET',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-j',
            'ACCEPT'
          ]
        },
        { cmd: 'iptables', argv: ['-t', 'filter', '-A', 'YTL_LAN_WAN_IPSET', '-j', 'DROP'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-C',
            'FORWARD',
            '-i',
            'eth0',
            '-o',
            'eth1',
            '-m',
            'conntrack',
            '--ctstate',
            'RELATED,ESTABLISHED',
            '-j',
            'ACCEPT'
          ]
        },
        {
          cmd: 'iptables',
          argv: ['-t', 'filter', '-C', 'FORWARD', '-i', 'eth1', '-o', 'eth0', '-j', 'YTL_LAN_WAN_IPSET_LOG']
        },
        {
          cmd: 'iptables',
          argv: ['-t', 'filter', '-C', 'FORWARD', '-i', 'eth1', '-o', 'eth0', '-j', 'YTL_LAN_WAN_IPSET']
        },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'nat',
            '-C',
            'POSTROUTING',
            '-o',
            'eth0',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-j',
            'MASQUERADE'
          ]
        },
        { cmd: 'systemctl', argv: ['is-enabled', 'dnsmasq.service'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'endpoint.security.microsoft.com', 'A'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'smartscreen-prod.microsoft.com', 'A'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'smartscreen.microsoft.com', 'A'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet.service'] },
        { cmd: 'systemctl', argv: ['enable', 'dnsmasq.service'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet-discovery.service'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet-discovery.timer'] },
        { cmd: 'systemctl', argv: ['restart', 'systemd-resolved'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'dnsmasq.service'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet.service'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'] },
        { cmd: 'systemctl', argv: ['restart', 'docker'] }
      ])
    })
  })

  describe('destroy', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', 1)
      await assertCalls([
        { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] },
        { cmd: 'ip', argv: ['link', 'show', 'eth0'] },
        { cmd: 'ip', argv: ['link', 'show', 'eth1'] },
        { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', 'eth0'] },
        { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', 'eth1'] },
        { cmd: 'nmcli', argv: ['connection', 'delete', 'yo-eth1'] },
        {
          cmd: 'nmcli',
          argv: [
            'connection',
            'add',
            'type',
            'ethernet',
            'ifname',
            'eth1',
            'con-name',
            'yo-eth1',
            'ip4',
            '192.168.10.1/16',
            'autoconnect',
            'yes',
            'save',
            'yes'
          ]
        },
        { cmd: 'nmcli', argv: ['connection', 'modify', 'yo-eth1', 'ipv6.method', 'disabled'] },
        { cmd: 'nmcli', argv: ['connection', 'up', 'yo-eth1'] },
        { cmd: 'systemctl', argv: ['restart', 'NetworkManager.service'] },
        { cmd: 'nm-online', argv: ['-s', '-q', '--timeout=30'] },
        { cmd: 'ipset', argv: ['create', 'ytl_internet_allowlist', 'hash:ip', 'timeout', '3600', '-exist'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-N', 'YTL_LAN_WAN_IPSET_LOG'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-F', 'YTL_LAN_WAN_IPSET_LOG'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-A',
            'YTL_LAN_WAN_IPSET_LOG',
            '-m',
            'conntrack',
            '--ctstate',
            'NEW',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-m',
            'limit',
            '--limit',
            '10/second',
            '--limit-burst',
            '30',
            '-j',
            'LOG',
            '--log-prefix',
            'YTL ALLOW NEW ',
            '--log-level',
            '6'
          ]
        },
        { cmd: 'iptables', argv: ['-t', 'filter', '-A', 'YTL_LAN_WAN_IPSET_LOG', '-j', 'RETURN'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-N', 'YTL_LAN_WAN_IPSET'] },
        { cmd: 'iptables', argv: ['-t', 'filter', '-F', 'YTL_LAN_WAN_IPSET'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-A',
            'YTL_LAN_WAN_IPSET',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-j',
            'ACCEPT'
          ]
        },
        { cmd: 'iptables', argv: ['-t', 'filter', '-A', 'YTL_LAN_WAN_IPSET', '-j', 'DROP'] },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'filter',
            '-C',
            'FORWARD',
            '-i',
            'eth0',
            '-o',
            'eth1',
            '-m',
            'conntrack',
            '--ctstate',
            'RELATED,ESTABLISHED',
            '-j',
            'ACCEPT'
          ]
        },
        {
          cmd: 'iptables',
          argv: ['-t', 'filter', '-C', 'FORWARD', '-i', 'eth1', '-o', 'eth0', '-j', 'YTL_LAN_WAN_IPSET_LOG']
        },
        {
          cmd: 'iptables',
          argv: ['-t', 'filter', '-C', 'FORWARD', '-i', 'eth1', '-o', 'eth0', '-j', 'YTL_LAN_WAN_IPSET']
        },
        {
          cmd: 'iptables',
          argv: [
            '-t',
            'nat',
            '-C',
            'POSTROUTING',
            '-o',
            'eth0',
            '-m',
            'set',
            '--match-set',
            'ytl_internet_allowlist',
            'dst',
            '-j',
            'MASQUERADE'
          ]
        },
        { cmd: 'systemctl', argv: ['is-enabled', 'dnsmasq.service'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'endpoint.security.microsoft.com', 'A'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'smartscreen-prod.microsoft.com', 'A'] },
        { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', 'smartscreen.microsoft.com', 'A'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet.service'] },
        { cmd: 'systemctl', argv: ['enable', 'dnsmasq.service'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet-discovery.service'] },
        { cmd: 'systemctl', argv: ['enable', 'ytl-linux-digabi2-examnet-discovery.timer'] },
        { cmd: 'systemctl', argv: ['restart', 'systemd-resolved'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'dnsmasq.service'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet.service'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'] },
        { cmd: 'systemctl', argv: ['is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'] },
        { cmd: 'systemctl', argv: ['restart', 'docker'] }
      ])
    })
  })

  async function truncateCallsLog() {
    try {
      await access(callsLog)
      await truncate(callsLog)
    } catch {
      // callsLog doesn't exist yet
    }
  }

  async function initTempDir() {
    const root = await mkdtemp(join(tmpdir(), 'just-test-'))

    callsLog = join(root, 'calls.log')

    const mockBinDir = await makeTempDir(root, 'mock-bin-dir')
    const mockConfigDir = await makeTempDir(root, 'mock-config-dir')
    const mockTemplatesDir = await makeTempDir(root, 'mock-templates-dir')
    const mockResolvedDir = await makeTempDir(root, 'mock-resolved-dir')
    const mockDockerDir = await makeTempDir(root, 'mock-docker-dir')
    const mockDnsmasqDir = await makeTempDir(root, 'mock-dnsmasq-dir')
    const mockNaksu2WorkDir = await makeTempDir(root, 'naksu2-work-dir')
    const mockNaksu2CertsDir = await makeTempDir(mockNaksu2WorkDir, 'certs')

    await writeToTempDir(mockNaksu2CertsDir, 'domain.txt', 'kamreeri-kelvokas.koe.abitti.net')
    await writeToTempDir(mockBinDir, 'echo', mockScript)
    await writeToTempDir(mockBinDir, 'nmcli', mockScript)
    await writeToTempDir(mockBinDir, 'systemctl', mockScript)
    await writeToTempDir(mockBinDir, 'nm-online', mockScript)
    await writeToTempDir(mockBinDir, 'ip', mockScript)
    await writeToTempDir(mockBinDir, 'iptables', mockScript)
    await writeToTempDir(mockBinDir, 'ipset', mockScript)
    await writeToTempDir(mockBinDir, 'dig', mockScript)
    await writeToTempDir(mockBinDir, 'stat', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockBouncer)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-discovery', mockScript)

    await writeToTempDir(mockConfigDir, 'ncsi-hostnames', 'example.com')
    await writeToTempDir(mockConfigDir, 'server-own-ip', '127.0.0.1')
    await writeToTempDir(mockTemplatesDir, 'resolved.conf.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'docker-daemon.json.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'dnsmasq.conf.template', 'foobar')
    await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
    return {
      mockBinDir,
      mockConfigDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir
    }
  }

  async function assertCalls(expectedCalls: Object[]) {
    const calls = (await readFile(callsLog, 'utf8')).trim()
    const callsLines = calls.split('\n')
    // console.log(`expecting ${expectedCalls.length} calls to external programs`)
    const callsArray = callsLines.map(line => {
      // console.log(`parsing line ${line}`)
      return JSON.parse(line)
    })
    assert.deepEqual(callsArray, expectedCalls)
  }
})

const mockScript = `#!/usr/bin/env bash
node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const entry = {
    cmd: path.basename(process.argv[1]),
    argv: process.argv.slice(2),
  };
  // console.error(process.argv, "writing to", process.env.CALLS_LOG)
  if (process.argv[8] === "eth0") {
    console.log("127.0.0.1")
  } else {
    console.log("")
  }
  fs.appendFileSync(process.env.CALLS_LOG, JSON.stringify(entry) + "\\n");
' "$0" "$@"
exit 0
`

const mockBouncer = `#!/usr/bin/env bash
node -e '
  const fs = require("node:fs");
  fs.appendFileSync(process.env.CALLS_LOG, JSON.stringify({
    cmd: "ytl-linux-digabi2-bouncer",
    argv: process.argv.slice(1),
  }) + "\\n");
' "$@"
while true; do
  sleep 1
done
`

async function writeToTempDir(dir: string, name: string, script: string) {
  const file = join(dir, name)
  await writeFile(file, script, 'utf8')
  await chmod(file, 0o755)
  return file
}

async function makeTempDir(root: string, name: string) {
  const dir = join(root, name)
  await mkdir(dir, { recursive: true })
  return dir
}

async function waitForLogEntry(callsLog: string, msg: string) {
  const start = Date.now()
  while (Date.now() - start < 5000) {
    try {
      const contents = await readFile(callsLog, 'utf8')
      if (contents.includes(msg)) {
        break
      }
    } catch {
      // file may not exist yet
    }
    await new Promise(r => setTimeout(r, 100))
  }
}

async function killSubprocess(subprocess: any) {
  let killTimer
  try {
    process.kill(-subprocess.pid!, 'SIGTERM')

    killTimer = setTimeout(() => {
      try {
        process.kill(-subprocess.pid!, 'SIGKILL')
      } catch {}
    }, 1000)
    await Promise.race([subprocess.catch(() => {}), new Promise(r => setTimeout(r, 3000))])
  } finally {
    if (killTimer) clearTimeout(killTimer)
  }
}
