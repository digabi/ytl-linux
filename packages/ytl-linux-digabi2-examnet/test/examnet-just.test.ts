import assert from 'node:assert/strict'
import { test, describe, beforeEach, after } from 'node:test'
import { execa } from 'execa'
import { join } from 'node:path'
import { mkdtemp, writeFile, chmod, readFile, mkdir, unlink, truncate, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const ENV_TEST_MODE = { TEST_MODE: 'test' }
describe('examnet-just', async () => {
  let callsLog
  let mockBinDir
  let mockEtcDir
  let mockExamnetConfigDir
  let mockTemplatesDir
  let mockResolvedDir
  let mockDockerDir
  let mockDnsmasqDir
  let mockNaksu2WorkDir
  let mockNaksu2CertsDir
  let mockNetplanConfDir
  let mockScriptWithNoOutput
  let mockScriptReturningErrorCode
  let exitCodesTested = new Set<number>()

  beforeEach(async () => {
    ;({
      callsLog,
      mockBinDir,
      mockEtcDir,
      mockExamnetConfigDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir,
      mockNetplanConfDir,
      mockScriptWithNoOutput,
      mockScriptReturningErrorCode
    } = await initTempDir())
    await truncateCallsLog()
  })

  describe('command line argument validation', () => {
    test('returns error if WAN device is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(2, [])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(2, [], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('returns error if LAN device is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(4, ['eth0'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(4, ['eth0'], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('returns error if server number is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(7, ['eth0', 'eth1'])
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })

      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(7, ['eth0', 'eth1'], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir)])
      })
    })
    test('returns error if server number is wrong:', () => {
      test('invalid number', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', 'invalidNumber'], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
      test('too small integer (0)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '0'], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
      test('too large integer (25)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '25'], ENV_TEST_MODE)
        await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth1')])
      })
    })
    test('returns error if script is not called as root user', async () => {
      await runExamnetReturnsExitCode(1, ['eth0', 'eth1', '1'])
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
  })

  describe('bouncer (--daemon)', () => {
    test('returns error if net device lan configuration is missing', async () => {
      await runExamnetReturnsExitCode(21, ['eth0', 'eth1', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if server own ip configuration is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if server friendly name configuration is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if LAN device does not have IP address', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ip', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0')])
    })
    test('returns error if domain.txt is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await unlink(join(mockNaksu2CertsDir, 'domain.txt'))
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if domain.txt is empty', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockNaksu2CertsDir, 'domain.txt', '')
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0')])
    })
    test('returns error if daemon exits unexpectedly', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(22, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0'), callBouncer(mockNaksu2CertsDir)])
    })
    test('returns error if bouncer returns error', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(22, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0'), callBouncer(mockNaksu2CertsDir)])
    })
    test('returns error if lan ip does not match what is configured', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.20.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await runExamnetReturnsExitCode(21, ['eth1', 'eth0', '1', '--daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0')])
    })
    test('starts when correct parameters are given', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')

      // do not await runExamnet, as it stays running in daemon mode
      const subprocess = runExamnet('eth1', 'eth0', '1', '--daemon')
      await waitForLogEntry(callsLog, '"ytl-linux-digabi2-bouncer"')
      await killSubprocess(subprocess)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpAddrShow('eth0'), callBouncer(mockNaksu2CertsDir)])
    })
  })

  describe('restart-bouncer (--restart-daemon)', () => {
    test('returns error when systemctl fails', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(23, ['eth1', 'eth0', '1', '--restart-daemon'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service')])
    })
    test('runs when correct parameters are given', async () => {
      await runExamnet('eth1', 'eth0', '1', '--restart-daemon')
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service')
      ])
    })
  })

  describe('discovery (--discover)', () => {
    test('returns error if static dns configuration is missing', async () => {
      await runExamnetReturnsExitCode(28, ['eth0', 'eth1', '1', '--discover'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if server own IP file is missing', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await runExamnetReturnsExitCode(28, ['eth0', 'eth1', '1', '--discover'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('returns error if discovery returns error', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-discovery', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(28, ['eth0', 'eth1', '1', '--discover'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir)])
    })
    test('runs when correct parameters are given', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnet('eth0', 'eth1', '1', '--discover')
      await assertCalls([callStat(mockNaksu2WorkDir), callDiscovery(mockDnsmasqDir, mockExamnetConfigDir)])
    })
  })

  describe('destroy (--remove)', () => {
    test('returns error if removing configuration files fails', async () => {
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(17, ['eth0', 'eth1', '1', '--remove'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet.service', '--now'),
        callSystemctl('disable', 'dnsmasq.service', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`)
      ])
    })
    test('returns error if listing connection fails', async () => {
      await writeToTempDir(mockBinDir, 'nmcli', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(18, ['eth0', 'eth1', '1', '--remove'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet.service', '--now'),
        callSystemctl('disable', 'dnsmasq.service', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callSed(`${mockEtcDir}/hosts`),
        callNmcli()
      ])
    })
    test('returns error if disabling services fails', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(23, ['eth0', 'eth1', '1', '--remove'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet.service', '--now')
      ])
    })
    test('returns error if waiting for network online fails', async () => {
      await writeToTempDir(mockBinDir, 'nm-online', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await runExamnetReturnsExitCode(27, ['eth0', 'eth1', '1', '--remove'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet.service', '--now'),
        callSystemctl('disable', 'dnsmasq.service', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callSed(`${mockEtcDir}/hosts`),
        callNmcli(),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('restart', 'NetworkManager.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'systemctl', argv: ['restart', 'docker'] },
        callNmonline(5)
      ])
    })
    test('runs when correct parameters are given', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await runExamnet('eth0', 'eth1', '1', '--remove')
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet.service', '--now'),
        callSystemctl('disable', 'dnsmasq.service', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callSed(`${mockEtcDir}/hosts`),
        callNmcli(),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('restart', 'NetworkManager.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'systemctl', argv: ['restart', 'docker'] },
        callNmonline(5)
      ])
    })
  })

  describe('setup (no command flag)', () => {
    test('returns error if WAN device does not have an IP address', async () => {
      await runExamnetReturnsExitCode(15, ['eth1', 'eth0', '1'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callIpLinkShow('eth1'),
        callIpLinkShow('eth0'),
        callIpAddrShow('eth1')
      ])
    })
    test('returns error if same devices is used for WAN and LAN', async () => {
      await writeToTempDir(mockBinDir, 'ip', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(6, ['eth0', 'eth0', '1'], ENV_TEST_MODE)
      await assertCalls([callStat(mockNaksu2WorkDir), callIpLinkShow('eth0'), callIpLinkShow('eth0')])
    })
    test('returns error if server friendly name is invalid', async () => {
      await runExamnetReturnsExitCode(25, ['eth0', 'eth1', '1', 'väärin-nimetty'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1')
      ])
    })
    test('returns error if network device cannot be configured', async () => {
      await writeToTempDir(mockBinDir, 'nmcli', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(12, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callStat(mockNaksu2WorkDir),
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16')
      ])
    })
    test('returns error if NetworkManager cannot be restarted', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(14, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service')
      ])
    })
    test('returns error if netplan configuration cannot be removed', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(17, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`)
      ])
    })
    test('returns error if dnsmasq settings cannot be removed', async () => {
      await unlink(join(mockNetplanConfDir, '50-cloud-init.yaml'))
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(17, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
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
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`)
      ])
    })
    test('returns error if --use-static-local-dns flag is given and cert.pem is missing', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await unlink(join(mockNaksu2CertsDir, 'cert.pem'))
      await runExamnetReturnsExitCode(24, ['eth0', 'eth1', '1', '--use-static-local-dns'], ENV_TEST_MODE)
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`)
      ])
    })
    test('returns error if --use-static-local-dns flag is given and certificate did not contain valid domain for server number', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockBinDir, 'openssl', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(20, ['eth0', 'eth1', '1', '--use-static-local-dns'], ENV_TEST_MODE)
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callOpenssl(mockNaksu2CertsDir)
      ])
    })
    test('returns error if configuring docker fails', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-docker-configure.sh', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(29, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['10.0.10.1', '192.168.10.1'] }
      ])
    })
    test('runs when correct parameters are given', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['10.0.10.1', '192.168.10.1'] }
      ])
      await assertFileExists(mockExamnetConfigDir, 'net-device-lan')
      await assertFileExists(mockExamnetConfigDir, 'net-device-wan')
      await assertFileExists(mockExamnetConfigDir, 'server-own-ip')
      await assertFileExists(mockExamnetConfigDir, 'server-friendly-name', 'ktp1\n')
      await assertFileExists(mockResolvedDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux.conf')
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt')
    })
    test('runs when correct parameters are given with friendly name', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await runExamnet('eth0', 'eth1', '1', 'perunakellari')
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['10.0.10.1', '192.168.10.1'] }
      ])
      await assertFileExists(mockExamnetConfigDir, 'net-device-lan')
      await assertFileExists(mockExamnetConfigDir, 'net-device-wan')
      await assertFileExists(mockExamnetConfigDir, 'server-own-ip')
      await assertFileExists(mockExamnetConfigDir, 'server-friendly-name', 'perunakellari\n')
      await assertFileExists(mockResolvedDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux.conf')
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt')
    })
    test('runs when correct parameters are given with friendly name and --use-static-local-dns', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await runExamnet('eth0', 'eth1', '1', 'perunakellari', '--use-static-local-dns')
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
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager.service'),
        callNmonline(),
        callRm(`${mockDnsmasqDir}/ytl-linux-static-dns-records.conf`),
        callOpenssl(mockNaksu2CertsDir),
        { cmd: 'sudo', argv: ['tee', '-a', `${mockEtcDir}/hosts`] },
        callSystemctl('enable', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('enable', 'dnsmasq.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('is-enabled', 'dnsmasq.service'),
        callSystemctl('restart', 'dnsmasq.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet.service'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        { cmd: 'ytl-linux-digabi2-docker-configure.sh', argv: ['10.0.10.1', '192.168.10.1'] }
      ])
      await assertFileExists(mockExamnetConfigDir, 'net-device-lan')
      await assertFileExists(mockExamnetConfigDir, 'net-device-wan')
      await assertFileExists(mockExamnetConfigDir, 'server-own-ip')
      await assertFileExists(mockExamnetConfigDir, 'server-friendly-name', 'perunakellari\n')
      await assertFileExists(mockResolvedDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf')
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt')
    })
  })

  test('all exit codes are tested', () => {
    const sortedExitCodes = Array.from(exitCodesTested).sort((a, b) => a - b)
    // TODO these exit codes are currently not tested: 3, 5, 9, 10, 11, 13, 19,
    assert.deepEqual(sortedExitCodes, [1, 2, 4, 6, 7, 8, 12, 14, 15, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 29])
  })

  function runExamnetWithArguments(examnetArguments: string[], envOverrides: NodeJS.Dict<string> = {}) {
    return execa('./ytl-linux-digabi2-examnet-just', examnetArguments.filter(Boolean), {
      env: {
        ...process.env,
        PATH: `${mockBinDir}:${process.env.PATH}`,
        CALLS_LOG: callsLog,
        PATH_EXAMNET_CONFIG: mockExamnetConfigDir,
        PATH_TEMPLATES: mockTemplatesDir,
        PATH_RESOLVED: mockResolvedDir,
        PATH_DOCKER: mockDockerDir,
        PATH_DNSMASQ: mockDnsmasqDir,
        NAKSU2_WORKDIR: mockNaksu2WorkDir,
        PATH_NETPLAN: mockNetplanConfDir,
        PATH_ETC: mockEtcDir,
        BIN_DIGABI2_EXAMNET_BOUNCER: 'ytl-linux-digabi2-bouncer',
        BIN_DIGABI2_EXAMNET_DISCOVERY: 'ytl-linux-digabi2-discovery',
        ...envOverrides
      },
      detached: true,
      stdio: 'inherit'
    })
  }

  async function runExamnetReturnsExitCode(
    expectedExitCode: number,
    examnetArguments: string[],
    env: NodeJS.Dict<string> = {}
  ) {
    try {
      await runExamnetWithArguments(examnetArguments, env)
      assert.fail('Expected runExamnet to fail, but it succeeded')
    } catch (e) {
      exitCodesTested.add(e.exitCode)
      assert.equal(e.exitCode, expectedExitCode)
    }
  }

  function runExamnet(
    netDeviceWan: string,
    netDeviceLan: string,
    serverNumber: string,
    serverFriendlyName?: string,
    extraFlag?: string
  ) {
    return runExamnetWithArguments(
      [netDeviceWan, netDeviceLan, serverNumber, serverFriendlyName, extraFlag].filter(Boolean),
      ENV_TEST_MODE
    )
  }

  async function assertFileExists(directory: string, fileName: string, expectedFileContents?: string) {
    const filePath = join(directory, fileName)
    try {
      await access(filePath)
    } catch {
      assert.fail(`Expected file ${fileName} to exist in directory ${directory}, but it does not`)
    }
    if (expectedFileContents) {
      const actualFileContents = await readFile(filePath, 'utf8')
      assert.equal(actualFileContents, expectedFileContents)
    }
  }

  async function truncateCallsLog() {
    try {
      await access(callsLog)
      await truncate(callsLog)
    } catch {
      if (callsLog) {
        // create callsLog file
        await writeFile(callsLog, '')
      }
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
    const mockEtcDir = await makeTempDir(root, 'mock-etc-dir')
    const mockExamnetConfigDir = await makeTempDir(root, 'mock-config-dir')
    const mockTemplatesDir = await makeTempDir(root, 'mock-templates-dir')
    const mockResolvedDir = await makeTempDir(root, 'mock-resolved-dir')
    const mockDockerDir = await makeTempDir(root, 'mock-docker-dir')
    const mockDnsmasqDir = await makeTempDir(root, 'mock-dnsmasq-dir')
    const mockNaksu2WorkDir = await makeTempDir(root, 'naksu2-work-dir')
    const mockNaksu2CertsDir = await makeTempDir(mockNaksu2WorkDir, 'certs')
    const mockNetplanConfDir = await makeTempDir(root, 'mock-etc-netplan')
    await writeToTempDir(mockNaksu2CertsDir, 'domain.txt', 'ktp1.1000.koe.abitti.net')
    await writeToTempDir(
      mockNaksu2CertsDir,
      'fullchain.pem',
      '-----BEGIN CERTIFICATE-----\ntest fullchain pem\n-----END CERTIFICATE-----'
    )
    await writeToTempDir(
      mockNaksu2CertsDir,
      'key.pem',
      '-----BEGIN PRIVATE KEY-----\ntest key pem\n-----END PRIVATE KEY-----'
    )
    await writeToTempDir(
      mockNaksu2CertsDir,
      'cert.pem',
      '-----BEGIN CERTIFICATE-----\nfoobar\n-----END CERTIFICATE-----'
    )
    const mockScriptTsPath = join(process.cwd(), 'test', 'mock-script.ts')
    const mockScript = await bashWrapMockScript(mockScriptTsPath)

    await writeToTempDir(mockBinDir, 'echo', mockScript)
    await writeToTempDir(mockBinDir, 'ip', mockScript)
    await writeToTempDir(mockBinDir, 'systemctl', mockScript)
    await writeToTempDir(mockBinDir, 'nmcli', mockScript)
    await writeToTempDir(mockBinDir, 'nm-online', mockScript)
    await writeToTempDir(mockBinDir, 'sed', mockScript)
    await writeToTempDir(mockBinDir, 'openssl', mockScript)
    await writeToTempDir(mockBinDir, 'stat', mockScript)
    await writeToTempDir(mockBinDir, 'rm', mockScript)
    await writeToTempDir(mockBinDir, 'sudo', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-discovery', mockScript)
    await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-docker-configure.sh', mockScript)
    // external programs that are not mocked:
    // - grep
    // - tr
    // - cut
    // - mkdir
    // - xargs
    // - chown

    await writeToTempDir(
      mockExamnetConfigDir,
      'ncsi-hostnames',
      'dns.msftncsi.com,www.msftncsi.com,www.msftconnecttest.com,ipv6.msftconnecttest.com'
    )
    await writeToTempDir(mockExamnetConfigDir, 'discovery.db', 'foo')
    await writeToTempDir(mockTemplatesDir, 'resolved.conf.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'docker-daemon.json.template', 'foobar')
    await writeToTempDir(mockTemplatesDir, 'dnsmasq.conf.template', 'foobar')
    await writeToTempDir(mockNetplanConfDir, '50-cloud-init.yaml', 'baz')
    await writeToTempDir(mockEtcDir, 'hosts', '# test /etc/hosts file\n')

    const mockScriptWithNoOutputTsPath = join(process.cwd(), 'test', 'mock-script-with-no-output.ts')
    const mockScriptWithNoOutput = await bashWrapMockScript(mockScriptWithNoOutputTsPath)

    const mockScriptReturningErrorCodeTsPath = join(process.cwd(), 'test', 'mock-script-returning-error-code.ts')
    const mockScriptReturningErrorCode = await bashWrapMockScript(mockScriptReturningErrorCodeTsPath)

    return {
      callsLog,
      mockBinDir,
      mockEtcDir,
      mockExamnetConfigDir,
      mockNetplanConfDir,
      mockTemplatesDir,
      mockResolvedDir,
      mockDockerDir,
      mockDnsmasqDir,
      mockNaksu2WorkDir,
      mockNaksu2CertsDir,
      mockScriptWithNoOutput,
      mockScriptReturningErrorCode
    }
  }

  async function assertCalls(expectedCalls: Object[]) {
    const calls = (await readFile(callsLog, 'utf8')).trim()
    const callsLines = calls.split('\n')
    // console.log(`expecting ${expectedCalls.length} calls to external programs`)
    const callsArray = callsLines
      .map(line => {
        // console.log(`parsing line ${line}`)
        return line ? JSON.parse(line) : undefined
      })
      .filter(Boolean)
    assert.deepEqual(callsArray, expectedCalls.filter(Boolean))
  }
})

async function writeToTempDir(dir: string, name: string, fileContents: string) {
  const file = join(dir, name)
  await writeFile(file, fileContents, 'utf8')
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
  while (Date.now() - start < 10000) {
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

function callStat(_mockNaksu2WorkDir) {
  return undefined
}

function callBouncer(mockNaksu2CertsDir: string) {
  return {
    cmd: 'ytl-linux-digabi2-bouncer',
    argv: [
      `    {        "config": {            "friendlyName": "foobar",             "canonicalHostname": "ktp1.1000.koe.abitti.net",             "ncsiHostnames": ["dns.msftncsi.com","www.msftncsi.com","www.msftconnecttest.com","ipv6.msftconnecttest.com"],             "searchDomain": "internal",             "serverOwnIp": "10.0.10.1",             "ports": {"discovery": 26464, "bouncer": 80}         },         "secrets": {"cert":"${mockNaksu2CertsDir}/fullchain.pem","key":"${mockNaksu2CertsDir}/key.pem"}     }`
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

function callSystemctl(cmd: string, service: string, flags?: string) {
  return { cmd: 'systemctl', argv: [cmd, flags, service].filter(Boolean) }
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

function callNmonline(timeout: number = 30) {
  return { cmd: 'nm-online', argv: ['-s', '-q', `--timeout=${timeout}`] }
}

function callRm(path: string) {
  return { cmd: 'rm', argv: ['-f', path] }
}

function callSed(path: string) {
  return {
    cmd: 'sed',
    argv: ['-i', '', '/^# BEGIN SCHOOL DOMAIN ENTRIES$/,/^# END SCHOOL DOMAIN ENTRIES$/d', path]
  }
}

function callNmcli() {
  return { cmd: 'nmcli', argv: ['-f', 'UUID,NAME', 'connection', 'show'] }
}

function callOpenssl(path: string) {
  return { cmd: 'openssl', argv: ['x509', '-in', `${path}/cert.pem`, '-text', '-noout'] }
}

// These are not yet in use:
//
// function callDig(host: string) {
//   return { cmd: 'dig', argv: ['+time=1', '+tries=1', '@10.0.10.1', host, 'A'] }
// }
//
// function callIpsetCreate(listName: string) {
//   return { cmd: 'ipset', argv: ['create', listName, 'hash:ip', 'timeout', '3600', '-exist'] }
// }
//
// function callIptablesNewChain(chainName: string) {
//   return { cmd: 'iptables', argv: ['-t', 'filter', '-N', chainName] }
// }
//
// function callIptablesFlushChain(chainName: string) {
//   return { cmd: 'iptables', argv: ['-t', 'filter', '-F', chainName] }
// }
//
// function callIptablesCheckChain(chainName: string, networkDevice: string, jumpTarget: string) {
//   return {
//     cmd: 'iptables',
//     argv: ['-t', 'filter', '-C', chainName, '-i', networkDevice, '-o', 'eth0', '-j', jumpTarget]
//   }
// }
//
// function callIptablesAppendRule(chainName: string, jumpTarget: string) {
//   return { cmd: 'iptables', argv: ['-t', 'filter', '-A', chainName, '-j', jumpTarget] }
// }
