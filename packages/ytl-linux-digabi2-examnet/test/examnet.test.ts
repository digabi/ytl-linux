import assert from 'node:assert/strict'
import { test, describe, beforeEach } from 'node:test'
import { execa } from 'execa'
import { join } from 'node:path'
import { mkdtemp, writeFile, chmod, readFile, mkdir, unlink, truncate, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const ENV_TEST_MODE = { TEST_MODE: 'test' }
describe('examnet (just port)', () => {
  let callsLog
  let mockBinDir
  let mockEtcDir
  let mockExamnetConfigDir
  let mockTemplatesDir
  let mockResolvedDir
  let mockDockerDir
  let mockDnsmasqDir
  let mockSysctlDir
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
      mockSysctlDir,
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
        await runExamnetReturnsExitCode(1, [])
        await assertCalls([])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(1, [], ENV_TEST_MODE)
        await assertCalls([])
      })
    })
    test('returns error if LAN device is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(1, ['eth0'])
        await assertCalls([])
      })
      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(1, ['eth0'], ENV_TEST_MODE)
        await assertCalls([])
      })
    })
    test('returns error if server number is missing', () => {
      test('as non-root-user', async () => {
        await runExamnetReturnsExitCode(1, ['eth0', 'eth1'])
        await assertCalls([])
      })

      test('when accepcting non-root-user', async () => {
        await runExamnetReturnsExitCode(1, ['eth0', 'eth1'], ENV_TEST_MODE)
        await assertCalls([])
      })
    })
    test('returns error if server number is wrong:', () => {
      test('invalid number', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', 'invalidNumber'], ENV_TEST_MODE)
        await assertCalls([])
      })
      test('too small integer (0)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '0'], ENV_TEST_MODE)
        await assertCalls([])
      })
      test('too large integer (25)', async () => {
        await runExamnetReturnsExitCode(8, ['eth0', 'eth1', '25'], ENV_TEST_MODE)
        await assertCalls([])
      })
    })
    test('returns error if script is not called as root user', async () => {
      await runExamnetReturnsExitCode(2, ['eth0', 'eth1', '1'])
      await assertCalls([])
    })
  })

  describe('bouncer (--daemon)', () => {
    test('returns error if net device lan configuration is missing', async () => {
      await runExamnetReturnsExitCode(21, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if server own ip configuration is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await runExamnetReturnsExitCode(21, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if server friendly name configuration is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(21, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if domain.txt is missing', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await unlink(join(mockNaksu2CertsDir, 'domain.txt'))
      await runExamnetReturnsExitCode(21, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if domain.txt is empty', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockNaksu2CertsDir, 'domain.txt', '')
      await runExamnetReturnsExitCode(21, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if daemon exits unexpectedly', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(22, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([callBouncer(mockNaksu2CertsDir)])
    })
    test('returns error if bouncer returns error', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-bouncer', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(22, ['--daemon'], ENV_TEST_MODE)
      await assertCalls([callBouncer(mockNaksu2CertsDir)])
    })
    test('starts when correct parameters are given', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'net-device-lan', 'eth0')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockExamnetConfigDir, 'server-friendly-name', 'foobar')

      // do not await runExamnet, as it stays running in daemon mode
      const subprocess = runExamnetWithArguments(['--daemon'], ENV_TEST_MODE)
      await waitForLogEntry(callsLog, '"ytl-linux-digabi2-bouncer"')
      await killSubprocess(subprocess)
      await assertCalls([callBouncer(mockNaksu2CertsDir)])
    })
  })

  describe('restart-bouncer (--restart-daemon)', () => {
    test('returns error when systemctl fails', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(23, ['--restart-daemon'], ENV_TEST_MODE)
      await assertCalls([callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet')])
    })
    test('runs restart-bouncer when correct parameters are given', async () => {
      await runExamnetWithArguments(['--restart-daemon'], ENV_TEST_MODE)
      await assertCalls([
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('is-enabled', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service')
      ])
    })
  })

  describe('discovery (--discover)', () => {
    test('returns error if static dns configuration is missing', async () => {
      await runExamnetReturnsExitCode(28, ['--discovery'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if server own IP file is missing', async () => {
      await runExamnetReturnsExitCode(28, ['--discovery'], ENV_TEST_MODE)
      await assertCalls([])
    })
    test('returns error if discovery returns error', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await writeToTempDir(mockBinDir, 'ytl-linux-digabi2-discovery', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(22, ['--discovery'], ENV_TEST_MODE)
      await assertCalls([callDiscovery(mockDnsmasqDir, mockExamnetConfigDir)])
    })
    test('runs discovery when correct parameters are given', async () => {
      await writeToTempDir(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf', 'xyzzy')
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetWithArguments(['--discovery'], ENV_TEST_MODE)
      await assertCalls([callDiscovery(mockDnsmasqDir, mockExamnetConfigDir)])
    })
  })

  describe('destroy (--remove)', () => {
    test('returns error if removing configuration files fails', async () => {
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(17, ['--remove'], ENV_TEST_MODE)
      await assertCalls([
        callSystemctl('disable', 'ytl-linux-digabi2-examnet', '--now'),
        callSystemctl('disable', 'dnsmasq', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`)
      ])
    })
    test('returns error if listing connection fails', async () => {
      await writeToTempDir(mockBinDir, 'nmcli', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetReturnsExitCode(18, ['--remove'], ENV_TEST_MODE)
      await assertCalls([
        callSystemctl('disable', 'ytl-linux-digabi2-examnet', '--now'),
        callSystemctl('disable', 'dnsmasq', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callSed(`${mockEtcDir}/hosts`),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callSysctl('0'),
        callNmcli()
      ])
    })
    test('returns error if disabling services fails', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(23, ['--remove'], ENV_TEST_MODE)
      await assertCalls([callSystemctl('disable', 'ytl-linux-digabi2-examnet', '--now')])
    })
    test('runs destroy without error even if waiting for network online fails', async () => {
      await writeToTempDir(mockBinDir, 'nm-online', mockScriptReturningErrorCode)
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetWithArguments(['--remove'], ENV_TEST_MODE)
      await assertCalls([
        callSystemctl('disable', 'ytl-linux-digabi2-examnet', '--now'),
        callSystemctl('disable', 'dnsmasq', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callSed(`${mockEtcDir}/hosts`),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callSysctl('0'),
        callNmcli(),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('restart', 'NetworkManager'),
        { cmd: 'systemctl', argv: ['restart', 'docker'] },
        callNmonline(5)
      ])
    })
    test('runs destroy when correct parameters are given', async () => {
      await writeToTempDir(mockExamnetConfigDir, 'server-own-ip', '10.0.10.1')
      await runExamnetWithArguments(['--remove'], ENV_TEST_MODE)
      await assertCalls([
        callSystemctl('disable', 'ytl-linux-digabi2-examnet', '--now'),
        callSystemctl('disable', 'dnsmasq', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.timer', '--now'),
        callSystemctl('disable', 'ytl-linux-digabi2-examnet-discovery.service', '--now'),
        callRm(`${mockExamnetConfigDir}/server-own-ip`),
        callRm(`${mockExamnetConfigDir}/discovery.db`),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callSed(`${mockEtcDir}/hosts`),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callSysctl('0'),
        callNmcli(),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('restart', 'NetworkManager'),
        { cmd: 'systemctl', argv: ['restart', 'docker'] },
        callNmonline(5)
      ])
    })
  })

  describe('setup (no command flag)', () => {
    test('returns error if WAN device does not exist', async () => {
      await writeToTempDir(mockBinDir, 'ip', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(3, ['eth1', 'eth0', '1'], ENV_TEST_MODE)
      await assertCalls([callIpLinkShow('eth1')])
    })
    test('returns error if WAN device does not have an IP address', async () => {
      await runExamnetReturnsExitCode(7, ['eth1', 'eth0', '1'], ENV_TEST_MODE)
      await assertCalls([callIpLinkShow('eth1'), callIpLinkShow('eth0'), callIpAddrShow('eth1')])
    })
    test('returns error if same devices is used for WAN and LAN', async () => {
      await writeToTempDir(mockBinDir, 'ip', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(6, ['eth0', 'eth0', '1'], ENV_TEST_MODE)
      await assertCalls([callIpLinkShow('eth0')])
    })
    test('returns error if server friendly name is invalid', async () => {
      await runExamnetReturnsExitCode(25, ['eth0', 'eth1', '1', 'väärin-nimetty'], ENV_TEST_MODE)
      await assertCalls([callIpLinkShow('eth0'), callIpLinkShow('eth1')])
    })
    test('returns error if network device cannot be configured', async () => {
      await writeToTempDir(mockBinDir, 'nmcli', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(30, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16')
      ])
    })
    test('returns error if NetworkManager cannot be restarted', async () => {
      await writeToTempDir(mockBinDir, 'systemctl', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(23, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager')
      ])
    })
    test('returns error if netplan configuration cannot be removed', async () => {
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(17, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`)
      ])
    })
    test('returns error if dnsmasq settings cannot be removed', async () => {
      await unlink(join(mockNetplanConfDir, '50-cloud-init.yaml'))
      await writeToTempDir(mockBinDir, 'rm', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(17, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`)
      ])
    })
    test('returns error if cert.pem is missing', async () => {
      await unlink(join(mockNaksu2CertsDir, 'cert.pem'))
      await runExamnetReturnsExitCode(24, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`)
      ])
    })
    test('returns error if certificate does not contain valid domain for server number', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockBinDir, 'openssl', mockScriptWithNoOutput)
      await runExamnetReturnsExitCode(20, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callOpenssl(mockNaksu2CertsDir)
      ])
    })
    test('returns error if running ipset fails', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockBinDir, 'ipset', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(30, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callOpenssl(mockNaksu2CertsDir),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callSudoTeeAppendToFile(`${mockEtcDir}/hosts`),
        callStat(mockNaksu2WorkDir),
        callChown(join(mockNaksu2WorkDir, 'certs/domain.txt')),

        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callSysctl('1'),

        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),

        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesNewChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpsetCreate('ytl_internet_allowlist')
      ])
    })
    test('returns error if configuring docker fails', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await unlink(join(mockTemplatesDir, 'docker-daemon.json.template'))
      await runExamnetReturnsExitCode(30, ['eth0', 'eth1', '1'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callOpenssl(mockNaksu2CertsDir),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callSudoTeeAppendToFile(`${mockEtcDir}/hosts`),
        callStat(mockNaksu2WorkDir),
        callChown(join(mockNaksu2WorkDir, 'certs/domain.txt')),

        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callSysctl('1'),

        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),

        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesNewChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callIpsetCreate('ytl_internet_allowlist'),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match conntrack --ctstate NEW --match set --match-set ytl_internet_allowlist dst --match limit --limit 10/second --limit-burst 30 --jump LOG --log-prefix YTL_ALLOW_NEW --log-level 6'
        ),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match set --match-set ytl_internet_allowlist dst --jump ACCEPT'
        ),
        callIptablesCheckChain('filter', 'YTL_LAN_WAN_IPSET', '--jump DROP'),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth0 --out-interface eth1 --match comment --comment ytl_internet_allowlist --match conntrack --ctstate RELATED,ESTABLISHED --jump ACCEPT'
        ),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth1 --out-interface eth0 --match comment --comment ytl_internet_allowlist --jump YTL_LAN_WAN_IPSET'
        ),
        callIptablesCheckChain(
          'nat',
          'POSTROUTING',
          '--out-interface eth0 --match comment --comment ytl_internet_allowlist --match set --match-set ytl_internet_allowlist dst --jump MASQUERADE'
        )
      ])
    })
    test('runs setup when correct parameters are given', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await runExamnet('eth0', 'eth1', '1')
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callOpenssl(mockNaksu2CertsDir),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callSudoTeeAppendToFile(`${mockEtcDir}/hosts`),
        callStat(mockNaksu2WorkDir),
        callChown(join(mockNaksu2WorkDir, 'certs/domain.txt')),

        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callSysctl('1'),

        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),

        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesNewChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callIpsetCreate('ytl_internet_allowlist'),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match conntrack --ctstate NEW --match set --match-set ytl_internet_allowlist dst --match limit --limit 10/second --limit-burst 30 --jump LOG --log-prefix YTL_ALLOW_NEW --log-level 6'
        ),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match set --match-set ytl_internet_allowlist dst --jump ACCEPT'
        ),
        callIptablesCheckChain('filter', 'YTL_LAN_WAN_IPSET', '--jump DROP'),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth0 --out-interface eth1 --match comment --comment ytl_internet_allowlist --match conntrack --ctstate RELATED,ESTABLISHED --jump ACCEPT'
        ),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth1 --out-interface eth0 --match comment --comment ytl_internet_allowlist --jump YTL_LAN_WAN_IPSET'
        ),
        callIptablesCheckChain(
          'nat',
          'POSTROUTING',
          '--out-interface eth0 --match comment --comment ytl_internet_allowlist --match set --match-set ytl_internet_allowlist dst --jump MASQUERADE'
        ),

        callSystemctl('restart', 'docker'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet'),
        callSystemctl('enable', 'dnsmasq'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('restart', 'dnsmasq'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        callDig('endpoint.security.microsoft.com'),
        callDig('smartscreen-prod.microsoft.com'),
        callDig('smartscreen.microsoft.com')
      ])
      await assertFileExists(mockExamnetConfigDir, 'net-device-lan')
      await assertFileExists(mockExamnetConfigDir, 'net-device-wan')
      await assertFileExists(mockExamnetConfigDir, 'server-own-ip')
      await assertFileExists(mockExamnetConfigDir, 'server-friendly-name', 'ktp1\n')
      await assertFileExists(mockResolvedDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf')
      await assertFileExists(mockSysctlDir, '99-ytl-linux-digabi2-examnet.conf')
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt')
      await assertFileExists(
        mockDockerDir,
        'daemon.json',
        '{\n' +
          '  "dns": ["10.0.0.1"],\n' +
          '  "default-address-pools":\n' +
          '  [\n' +
          '    {"base": "10.0.0.0/16", "size":24}\n' +
          '  ]\n' +
          '}\n'
      )
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt', 'ktp1.999.koe.abitti.net\n')
    })
    test('returns error if waiting for network online fails', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await writeToTempDir(mockBinDir, 'nm-online', mockScriptReturningErrorCode)
      await runExamnetReturnsExitCode(27, ['eth0', 'eth1', '1', 'perunakellari'], ENV_TEST_MODE)
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline()
      ])
    })
    test('runs setup when correct parameters are given with friendly name', async () => {
      // use real sed to parse cert.pem
      await unlink(join(mockBinDir, 'sed'))
      await runExamnet('eth0', 'eth1', '1', 'perunakellari')
      await assertCalls([
        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callIpAddrShow('eth0'),
        callIpAddrShow('eth1'),
        callNmicliConnectionShow('yo-eth1'),
        callNmicliConnectionDelete('yo-eth1'),
        callNmicliConnectionAdd('yo-eth1', '192.168.10.1/16'),
        callNmicliConnectionModify('yo-eth1'),
        callNmicliConnectionUp('yo-eth1'),
        callRm(`${mockNetplanConfDir}/50-cloud-init.yaml`),
        callSystemctl('restart', 'NetworkManager'),
        callNmonline(),
        callRmRecursive(`${mockDnsmasqDir}/*`),
        callOpenssl(mockNaksu2CertsDir),
        callSudoTeeWriteToFile(`${mockEtcDir}/hosts`),
        callRm(`${mockEtcDir}/hosts.tmp`),
        callSudoTeeAppendToFile(`${mockEtcDir}/hosts`),
        callStat(mockNaksu2WorkDir),
        callChown(join(mockNaksu2WorkDir, 'certs/domain.txt')),

        callIpLinkShow('eth0'),
        callIpLinkShow('eth1'),
        callSysctl('1'),

        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('nat', 'POSTROUTING'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'FORWARD'),
        callIptablesList('filter', 'YTL_LAN_WAN_IPSET'),

        callIptablesFlushChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesDeleteChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIptablesNewChain('filter', 'YTL_LAN_WAN_IPSET'),
        callIpset('list', 'ytl_internet_allowlist'),
        callIpset('flush', 'ytl_internet_allowlist'),
        callIpset('destroy', 'ytl_internet_allowlist'),
        callIpsetCreate('ytl_internet_allowlist'),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match conntrack --ctstate NEW --match set --match-set ytl_internet_allowlist dst --match limit --limit 10/second --limit-burst 30 --jump LOG --log-prefix YTL_ALLOW_NEW --log-level 6'
        ),
        callIptablesCheckChain(
          'filter',
          'YTL_LAN_WAN_IPSET',
          '--match set --match-set ytl_internet_allowlist dst --jump ACCEPT'
        ),
        callIptablesCheckChain('filter', 'YTL_LAN_WAN_IPSET', '--jump DROP'),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth0 --out-interface eth1 --match comment --comment ytl_internet_allowlist --match conntrack --ctstate RELATED,ESTABLISHED --jump ACCEPT'
        ),
        callIptablesCheckChain(
          'filter',
          'FORWARD',
          '--in-interface eth1 --out-interface eth0 --match comment --comment ytl_internet_allowlist --jump YTL_LAN_WAN_IPSET'
        ),
        callIptablesCheckChain(
          'nat',
          'POSTROUTING',
          '--out-interface eth0 --match comment --comment ytl_internet_allowlist --match set --match-set ytl_internet_allowlist dst --jump MASQUERADE'
        ),

        callSystemctl('restart', 'docker'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet'),
        callSystemctl('enable', 'dnsmasq'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.service'),
        callSystemctl('enable', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'systemd-resolved'),
        callSystemctl('restart', 'dnsmasq'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.timer'),
        callSystemctl('restart', 'ytl-linux-digabi2-examnet-discovery.service'),
        callDig('endpoint.security.microsoft.com'),
        callDig('smartscreen-prod.microsoft.com'),
        callDig('smartscreen.microsoft.com')
      ])

      await assertFileExists(mockExamnetConfigDir, 'net-device-lan')
      await assertFileExists(mockExamnetConfigDir, 'net-device-wan')
      await assertFileExists(mockExamnetConfigDir, 'server-own-ip')
      await assertFileExists(mockExamnetConfigDir, 'server-friendly-name', 'perunakellari\n')
      await assertFileExists(mockResolvedDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux.conf')
      await assertFileExists(mockDnsmasqDir, 'ytl-linux-static-dns-records.conf')
      await assertFileExists(mockSysctlDir, '99-ytl-linux-digabi2-examnet.conf')
      await assertFileExists(mockNaksu2CertsDir, 'domain.txt')
      // TODO tarkista daemon.json:in sisältö
    })
  })

  test('all exit codes are tested', () => {
    const sortedExitCodes = Array.from(exitCodesTested).sort((a, b) => a - b)
    assert.deepEqual(sortedExitCodes, [1, 2, 3, 6, 7, 8, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30])
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
        PATH_SYSCTL: mockSysctlDir,
        NAKSU2_WORKDIR: mockNaksu2WorkDir,
        PATH_NETPLAN: mockNetplanConfDir,
        PATH_ETC: mockEtcDir,
        PATH_JUSTFILE: './justfile',
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
    const mockSysctlDir = await makeTempDir(root, 'mock-sysctl-dir')
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
      '-----BEGIN CERTIFICATE-----\n' +
        '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\n' +
        '9dYAcnlYVl1EHrhDhIIzhqc=\n' +
        '-----END CERTIFICATE-----'
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
    await writeToTempDir(mockBinDir, 'chown', mockScript)
    await writeToTempDir(mockBinDir, 'iptables', mockScript)
    await writeToTempDir(mockBinDir, 'ipset', mockScript)
    await writeToTempDir(mockBinDir, 'sysctl', mockScript)
    await writeToTempDir(mockBinDir, 'dig', mockScript)
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
    await writeToTempDir(
      mockTemplatesDir,
      'docker-daemon.json.template',
      '{\n' +
        '  "dns": ["${DOCKER_NETWORK_DNS_RESOLVER_IP}"],\n' +
        '  "default-address-pools":\n' +
        '  [\n' +
        '    {"base": "${DOCKER_NETWORK_POOL_BASE_IP}/16", "size":24}\n' +
        '  ]\n' +
        '}\n'
    )
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
      mockSysctlDir,
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
        console.log(`parsing line ${line}`)
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

function callStat(mockNaksu2WorkDir) {
  return { cmd: 'stat', argv: ['-c', '%U:%G', mockNaksu2WorkDir] }
}

function callChown(file) {
  return { cmd: 'chown', argv: ['nobody:nobody', file] }
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

function callNmicliConnectionShow(connectionName: string) {
  return { cmd: 'nmcli', argv: ['connection', 'show', connectionName] }
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

function callRmRecursive(path: string) {
  return { cmd: 'rm', argv: ['-rf', path] }
}

function callSed(path: string) {
  return {
    cmd: 'sed',
    argv: ['/^# BEGIN SCHOOL DOMAIN ENTRIES$/,/^# END SCHOOL DOMAIN ENTRIES$/d', path]
  }
}

function callNmcli() {
  return { cmd: 'nmcli', argv: ['-f', 'UUID,NAME', 'connection', 'show'] }
}

function callOpenssl(path: string) {
  return { cmd: 'openssl', argv: ['x509', '-in', `${path}/cert.pem`, '-text', '-noout'] }
}

function callSudoTeeAppendToFile(file: string) {
  return { cmd: 'sudo', argv: ['tee', '-a', file] }
}

function callSudoTeeWriteToFile(file: string) {
  return { cmd: 'sudo', argv: ['tee', file] }
}

function callDig(host: string) {
  return { cmd: 'dig', argv: ['+time=1', '+tries=1', '@192.168.10.1', host, 'A'] }
}

function callIpsetCreate(list: string) {
  return { cmd: 'ipset', argv: ['create', list, 'hash:ip', 'timeout', '3600', '-exist'] }
}

function callSysctl(value: string) {
  return { cmd: 'sysctl', argv: ['-w', `net.ipv4.ip_forward=${value}`] }
}

function callIpset(command: string, list: string) {
  return { cmd: 'ipset', argv: [command, list] }
}

function callIptablesList(table: string, chain: string) {
  return { cmd: 'iptables', argv: ['--wait', '--table', table, '--list', chain, '--line-numbers', '--numeric'] }
}
function callIptablesNewChain(table: string, chain: string) {
  return { cmd: 'iptables', argv: ['--wait', '--table', table, '--new-chain', chain] }
}

function callIptablesFlushChain(table: string, chain: string) {
  return { cmd: 'iptables', argv: ['--wait', '--table', table, '--flush', chain] }
}

function callIptablesDeleteChain(table: string, chain: string) {
  return { cmd: 'iptables', argv: ['--wait', '--table', table, '--delete-chain', chain] }
}

function callIptablesCheckChain(table: string, chain: string, rulespec: string) {
  return {
    cmd: 'iptables',
    argv: ['--wait', '--table', table, '--check', chain, ...rulespec.split(' ')]
  }
}

function callIptablesAppendRule(table: string, chain: string, jumpTarget: string) {
  return { cmd: 'iptables', argv: ['--wait', '--table', table, '--append', chain, '--jump', jumpTarget] }
}
