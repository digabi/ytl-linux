# ytl-linux-digabi2-examnet

This package contains setup tools and background services for Abitti 2 exam networks.

To build the deb package, run:

```bash
just deb
```

The main things this package contains are:

- Examnet setup utility ([`ytl-linux-digabi2-examnet`](./ytl-linux-digabi2-examnet) script, [`justfile`](./justfile) and [`lib`](./lib) directory)
  - Sets up the YTL-Linux machine to function as an exam network server, acting as DNS, DHCP and default gateway
  - Configures NetworkManager, dnsmasq, iptables, systemd, Docker etc. for this purpose
- Examnet bouncer service ([`bouncer`](./bouncer))
  - Bounces queries to server names (e.g. `liikuntasali`) to the full address of the Abitti 2 server (e.g. `ktp1.1000.koe.abitti.net`)
  - Opens an endpoint that the examnet alias discovery service will query when scanning for server names in the network
  - Fools Windows' Network Connection Status Indicator (NCSI) into thinking the exam network has internet, to prevent user confusion
- Examnet discovery service ([`discovery`](./discovery))
  - Periodically scans all known Abitti 2 server domains for their server names, allowing all servers in the same network to correctly redirect queries for server names, in an eventually-consistent distributed system
  - This makes the server name system indifferent to the fact that student machines choose their DHCP and DNS pseudo-randomly; no matter which server the student machine is connected to, server names will redirect correctly

The examnet setup utility is just-based to support better modularisation than Bash scripts. The justfile in this directory is very complex and not meant to be invoked manually, it's invoked by the `ytl-linux-digabi2-examnet` script. That script is itself also rather complex and not per se meant for manual invocation either, but it can be done; see the script for what flags it can be run with.
