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
  let mockScriptWithNoOutput

  beforeEach(async () => {
    await truncateCallsLog()
    ;({
      callsLog,
      mockBinDir,
      mockConfigDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir,
      mockScriptWithNoOutput
    } = await initTempDir())
  })

  describe('command line argument validation', () => {
    test('gives error if WAN device is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(2, [])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(2, ['--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('gives error if LAN device is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(4, ['eth0'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(4, ['eth0', '--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('gives error if server number is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(7, ['eth0', 'eth1'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })

      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(7, ['eth0', 'eth1', '--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('gives error if server number is wrong:', () => {
      test('invalid number', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', 'invalidNumber', '--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
      test('too small integer (0)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '0', '--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
      test('too large integer (25)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '25', '--accept-non-root-user'])
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
    })
    test('gives error if script is not called as root user', async () => {
      await runExamnetReturnsExitCode(1, ['eth0', 'eth1', '1'])
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
  })

  describe('bouncer', async () => {
    test('gives error if net device lan configuration is missing', async () => {
      await runExamnetReturnsExitCode(21, ['eth0', 'eth1', '1', '--daemon', '--accept-non-root-user'])
    })
    test('gives error if server friendly name configuration is missing', async () => {
      await writeToTempDir(mockConfigDir, 'net-device-lan', 'eth0')
      await runExamnetReturnsExitCode(21, ['eth0', 'eth1', '1', '--daemon', '--accept-non-root-user'])
    })
    test('gives error if LAN device does not have IP address', async () => {
      await writeToTempDir(mockConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ip', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(21, ['eth0', 'eth1', '1', '--daemon', '--accept-non-root-user'])
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0')])
    })
    test('daemon starts when correct parameters are given', async () => {
      await writeToTempDir(mockConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockConfigDir, 'server-friendly-name', 'foobar')

      // do not await runExamnet, as it stays running in daemon mode
      const subprocess = runExamnet('eth0', 'eth1', '1', '--daemon')
      await waitForLogEntry(callsLog, '"ytl-linux-digabi2-bouncer"')
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0'), callBouncer(mockNaksu2CertsDir)])
      await killSubprocess(subprocess)
    })
  })

  describe('restart-bouncer', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', '1', '--restart-daemon')
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service')
      ])
    })
  })

  describe('discovery', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', '1', '--discovery')
      await assertCalls([callStat(mockNaksu2WorkDir), callDiscovery(mockDnsmasqDir, mockConfigDir)])
    })
  })

  describe('setup', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', '1')
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['127.0.0.1', '192.168.10.1'] }
      ])
    })
  })

  describe('destroy', () => {
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth0', 'eth1', '1')
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['127.0.0.1', '192.168.10.1'] }
      ])
    })
  })

  function runExamnetWithArguments(examnetArguments: string[]) {
    return execa('./ytl-linux-digabi2-examnet', examnetArguments.filter(Boolean), {
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
    })
  }

  async function runExamnetReturnsExitCode(expectedExitCode: number, examnetArguments: string[]) {
    try {
      await runExamnetWithArguments(examnetArguments)
      assert.fail('Expected runExamnet to fail, but it succeeded')
    } catch (e) {
      console.log(e)
      assert.equal(e.exitCode, expectedExitCode)
    }
  }

  function runExamnet(netDeviceWan: string, netDeviceLan: string, serverNumber: string, serverFriendlyName?: string) {
    return runExamnetWithArguments([
      netDeviceWan,
      netDeviceLan,
      serverNumber,
      serverFriendlyName,
      '--accept-non-root-user'
    ])
  }

  async function truncateCallsLog() {
    try {
      await access(callsLog)
      await truncate(callsLog)
    } catch {
      // callsLog doesn't exist yet
    }
  }

  async function bashWrapMockScript(mockScriptTSPath: string) {
    return `#!/usr/bin/env bash
    set -euo pipefail
    node --import tsx ${shellQuote(mockScriptTSPath)} "$0" "$@"
    `
  }

  function shellQuote(str: string) {
    return `'${str.replace(/'/g, `'\\''`)}'`
  }

  async function initTempDir() {
    const root = await mkdtemp(join(tmpdir(), 'just-test-'))

    const callsLog = join(root, 'calls.log')

    const mockBinDir = await makeTempDir(root, 'mock-bin-dir')
    const mockConfigDir = await makeTempDir(root, 'mock-config-dir')
    const mockTemplatesDir = await makeTempDir(root, 'mock-templates-dir')
    const mockResolvedDir = await makeTempDir(root, 'mock-resolved-dir')
    const mockDockerDir = await makeTempDir(root, 'mock-docker-dir')
    const mockDnsmasqDir = await makeTempDir(root, 'mock-dnsmasq-dir')
    const mockNaksu2WorkDir = await makeTempDir(root, 'naksu2-work-dir')
    const mockNaksu2CertsDir = await makeTempDir(mockNaksu2WorkDir, 'certs')

    await writeToTempDir(mockNaksu2CertsDir, 'domain.txt', 'kamreeri-kelvokas.koe.abitti.net')

    const mockScriptTsPath = join(process.cwd(), 'test', 'mock-script.ts')
    const mockScript = await bashWrapMockScript(mockScriptTsPath)

    await writeToTempDir(mockBinDir, 'echo', mockScript)
    await writeToTempDir(mockBinDir, 'nmcli', mockScript)
    await writeToTempDir(mockBinDir, 'systemctl', mockScript)
    await writeToTempDir(mockBinDir, 'nm-online', mockScript)
    await writeToTempDir(mockBinDir, 'ip', mockScript)
    await writeToTempDir(mockBinDir, 'iptables', mockScript)
    await writeToTempDir(mockBinDir, 'ipset', mockScript)
    await writeToTempDir(mockBinDir, 'dig', mockScript)
    await writeToTempDir(mockBinDir, 'stat', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-discovery', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-docker-configure.sh', mockScript)

    await writeToTempDir(mockConfigDir, 'ncsi-hostnames', 'example.com')
    await writeToTempDir(mockConfigDir, 'server-own-ip', '127.0.0.1')
    await writeToTempDir(mockTemplatesDir, 'resolved.conf.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'docker-daemon.json.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'dnsmasq.conf.template', 'foobar')
    await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')

    const mockScriptWithNoOutputTsPath = join(process.cwd(), 'test', 'mock-script-with-no-output.ts')
    const mockScriptWithNoOutput = await bashWrapMockScript(mockScriptWithNoOutputTsPath)

    return {
      callsLog,
      mockBinDir,
      mockConfigDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir,
      mockScriptWithNoOutput
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

function callStat(mockNaksu2WorkDir) {
  return { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] }
}

function callBouncer(mockNaksu2CertsDir: string) {
  return {
    cmd: 'ytl-linux-digabi2-bouncer',
    argv: [
      `    {        "config": {            "friendlyName": "foobar",             "canonicalHostname": "kamreeri-kelvokas.koe.abitti.net",             "ncsiHostnames": ["example.com"],             "searchDomain": "internal",             "serverOwnIp": "127.0.0.1",             "ports": {"discovery": 26464, "bouncer": 80}         },         "secrets": {"cert":"${mockNaksu2CertsDir}/fullchain.pem","key":"${mockNaksu2CertsDir}/key.pem"}     }`
    ]
  }
}

function callDiscovery(mockDnsmasqDir: string, mockConfigDir: string) {
  return {
    cmd: 'ytl-linux-digabi2-discovery',
    argv: [
      `    {\n        "config": {\n            "isProd": true,\n            "ktpDomains": [],\n            "dnsmasqConfigOutputFile": "${mockDnsmasqDir}/ytl-linux-ktp-aliases.conf",\n            "ports": {"discovery": 26464},\n            "dbPath": "${mockConfigDir}/discovery.db"\n        }\n    }`
    ]
  }
}

function callIpLinkShow(networkDevice: string) {
  return { cmd: 'ip', argv: ['link', 'show', networkDevice] }
}
function callIpAddrShow(networkDevice: string) {
  return { cmd: 'ip', argv: ['-oneline', '-4', 'addr', 'show', 'scope', 'global', networkDevice] }
}

function callSystemctl(cmd: string, service: string) {
  return { cmd: 'systemctl', argv: [cmd, service] }
}

function callDig(host: string) {
  return { cmd: 'dig', argv: ['+time=1', '+tries=1', '@127.0.0.1', host, 'A'] }
}

function callNmicliConnectionDelete(connectionName: string) {
  return { cmd: 'nmcli', argv: ['connection', 'delete', connectionName] }
}

function callNmicliConnectionModify(connectionName: string) {
  return { cmd: 'nmcli', argv: ['connection', 'modify', connectionName, 'ipv6.method', 'disabled'] }
}

function callNmicliConnectionAdd(connectionName: string, ipRange: string) {
  return {
    cmd: 'nmcli',
    argv: [
      'connection',
      'add',
      'type',
      'ethernet',
      'ifname',
      'eth1',
      'con-name',
      connectionName,
      'ip4',
      ipRange,
      'autoconnect',
      'yes',
      'save',
      'yes'
    ]
  }
}

function callNmicliConnectionUp(deviceName: string) {
  return { cmd: 'nmcli', argv: ['connection', 'up', deviceName] }
}

function callNmonline() {
  return { cmd: 'nm-online', argv: ['-s', '-q', '--timeout=30'] }
}

function callIpsetCreate(listName: string) {
  return { cmd: 'ipset', argv: ['create', listName, 'hash:ip', 'timeout', '3600', '-exist'] }
}

function callIptablesNewChain(chainName: string) {
  return { cmd: 'iptables', argv: ['-t', 'filter', '-N', chainName] }
}

function callIptablesFlushChain(chainName: string) {
  return { cmd: 'iptables', argv: ['-t', 'filter', '-F', chainName] }
}

function callIptablesCheckChain(chainName: string, networkDevice: string, jumpTarget: string) {
  return {
    cmd: 'iptables',
    argv: ['-t', 'filter', '-C', chainName, '-i', networkDevice, '-o', 'eth0', '-j', jumpTarget]
  }
}

function callIptablesAppendRule(chainName: string, jumpTarget: string) {
  return { cmd: 'iptables', argv: ['-t', 'filter', '-A', chainName, '-j', jumpTarget] }
}
